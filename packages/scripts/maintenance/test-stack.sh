#!/usr/bin/env bash
set -uo pipefail

# Non-regression test for one hub app.
#
# This is the gate that makes version bumps safe to automate. `check-versions.ts`
# only proves that a newer release exists upstream; it says nothing about
# whether the new image still starts with our compose file, our .env and our
# volumes. That is what this script answers, and it is why versions are never
# bumped by the metadata sync.
#
# What "works fine" means here, in increasing order of strength:
#   1. the compose file still resolves          (config)
#   2. every image referenced can be pulled     (pull)
#   3. every service reaches running/healthy    (up)
#   4. nothing crash-loops during a settle window
#   5. the app answers on its HTTP port, when one is exposed
#
# Run it against the *current* files to get a baseline, then against the bumped
# files: a bump is only acceptable if it does not turn a passing app into a
# failing one. An app that was already broken before the bump is not a
# regression, and blocking on it would freeze the catalogue forever.
#
# Usage:
#   packages/scripts/maintenance/test-stack.sh <slug> [--keep] [--timeout 180]
#
# Exit codes: 0 pass · 1 fail · 2 skipped (docker unavailable / not a compose app)

SLUG="${1:-}"
[ -n "$SLUG" ] || { echo "usage: $0 <slug> [--keep] [--timeout N]" >&2; exit 1; }
shift

KEEP=0
TIMEOUT=180
SETTLE=20
while [ $# -gt 0 ]; do
  case "$1" in
    --keep) KEEP=1 ;;
    --timeout) TIMEOUT="$2"; shift ;;
    --settle) SETTLE="$2"; shift ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIR="$ROOT/hub/$SLUG"
LOGDIR="${STACK_TEST_LOGS:-$ROOT/work/test-logs}/$SLUG"

[ -d "$DIR" ] || { echo "no such app: hub/$SLUG" >&2; exit 1; }
[ -f "$DIR/compose.yaml" ] || { echo "skip: $SLUG is not a compose app"; exit 2; }
command -v docker >/dev/null || { echo "skip: docker is not installed"; exit 2; }
docker info >/dev/null 2>&1 || { echo "skip: docker daemon is not running"; exit 2; }

mkdir -p "$LOGDIR"

# A dedicated project name keeps this run from colliding with (or worse,
# tearing down) whatever the developer is already running locally.
PROJECT="stacktest-$SLUG-$$"
export COMPOSE_PROJECT_NAME="$PROJECT"
# Volumes must live somewhere disposable: several hub apps default VOLUME_PATH
# to a host directory, and a test must not write into the user's real data.
WORKVOL="$(mktemp -d)"
export VOLUME_PATH="$WORKVOL/"
export DOMAIN="${DOMAIN:-stack.localhost}"
export PROJECT="$SLUG"

compose() { (cd "$DIR" && docker compose -p "$PROJECT" "$@"); }

cleanup() {
  local code=$?
  if [ "$KEEP" = "1" ]; then
    echo "--- keeping containers (project $PROJECT, volumes $WORKVOL)"
  else
    compose logs --no-color --tail 200 >"$LOGDIR/containers.log" 2>&1 || true
    compose down --volumes --remove-orphans --timeout 10 >/dev/null 2>&1 || true
    rm -rf "$WORKVOL" 2>/dev/null || true
  fi
  exit $code
}
trap cleanup EXIT INT TERM

fail() { echo "FAIL[$SLUG]: $*"; exit 1; }
step() { echo "--- $*"; }

# 1. Configuration resolves ---------------------------------------------------
step "config"
if ! compose config >"$LOGDIR/config.yaml" 2>"$LOGDIR/config.err"; then
  cat "$LOGDIR/config.err"
  fail "compose config is invalid"
fi

# 2. Images exist and can be pulled -------------------------------------------
step "pull"
if ! timeout "$((TIMEOUT * 2))" bash -c "cd '$DIR' && docker compose -p '$PROJECT' pull --quiet" \
     >"$LOGDIR/pull.log" 2>&1; then
  tail -20 "$LOGDIR/pull.log"
  fail "could not pull every image (a released version with no published image is a real blocker)"
fi

# 3. Everything starts --------------------------------------------------------
step "up"
if ! timeout "$TIMEOUT" bash -c "cd '$DIR' && docker compose -p '$PROJECT' up --detach --wait --wait-timeout $((TIMEOUT - 10))" \
     >"$LOGDIR/up.log" 2>&1; then
  # `--wait` fails on any container that exits or reports unhealthy. Show why.
  tail -30 "$LOGDIR/up.log"
  compose ps --format '{{.Service}}\t{{.State}}\t{{.Status}}' || true
  fail "services did not reach a healthy state within ${TIMEOUT}s"
fi

# 4. Nothing crash-loops once started -----------------------------------------
# `--wait` returns as soon as containers are up; apps that fail on their first
# real request (bad migration, missing env) only die a few seconds later.
step "settle (${SETTLE}s)"
sleep "$SETTLE"

bad=0
while IFS=$'\t' read -r service state status; do
  [ -n "$service" ] || continue
  case "$state" in
    running) ;;
    exited)
      # One-shot init containers legitimately exit 0.
      if echo "$status" | grep -qi "exit 0"; then
        echo "    $service exited cleanly (init container)"
      else
        echo "    $service: $state ($status)"; bad=1
      fi ;;
    *) echo "    $service: $state ($status)"; bad=1 ;;
  esac
done < <(compose ps --all --format '{{.Service}}\t{{.State}}\t{{.Status}}')
[ "$bad" = "0" ] || fail "some services are not running after the settle window"

if compose ps --format '{{.Status}}' | grep -qi "restarting"; then
  fail "a service is restarting in a loop"
fi

# 5. The app answers ----------------------------------------------------------
# "All containers are running" is a weak signal: a web app whose frontend fails
# to boot still leaves a happy container behind. So we make one real HTTP
# request.
#
# Most hub apps publish no port — they are reached through the Stack proxy,
# which learns the port from the `traefik...loadbalancer.server.port` label. We
# read that same label and probe from inside the compose network, which is
# exactly the path a real user's traffic takes.
step "probe"

published="$(compose ps --format '{{.Publishers}}' 2>/dev/null \
            | tr ',' '\n' | grep -o '"PublishedPort":[0-9]*' | cut -d: -f2 \
            | grep -v '^0$' | head -1 || true)"

probe() { # network host port -> HTTP status code, or 000
  docker run --rm --network "$1" curlimages/curl:8.11.1 \
    -s -o /dev/null -w '%{http_code}' --max-time 5 "http://$2:$3/" 2>/dev/null || echo 000
}

# Resolved config, so variables and label quoting are already normalised.
compose config --format json >"$LOGDIR/config.json" 2>/dev/null || true
targets="$(node -e '
  const cfg = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  for (const [name, svc] of Object.entries(cfg.services ?? {})) {
    const labels = Array.isArray(svc.labels)
      ? Object.fromEntries(svc.labels.map((l) => l.split(/=(.*)/).slice(0, 2)))
      : svc.labels ?? {};
    const key = Object.keys(labels).find((k) =>
      /^traefik\.http\.services\..*\.loadbalancer\.server\.port$/.test(k));
    if (key) console.log(name, String(labels[key]).replace(/"/g, ""));
  }' "$LOGDIR/config.json" 2>/dev/null || true)"

network="$(docker network ls --filter "name=^${PROJECT}_" --format '{{.Name}}' | head -1)"
[ -n "$network" ] || network="$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' \
  "$(compose ps -q | head -1)" 2>/dev/null | head -1)"

probed=0
if [ -n "$published" ]; then
  # A port published on the host is the strongest signal available: use it.
  ok=0
  for _ in $(seq 1 20); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$published/" || echo 000)"
    if [ "$code" != "000" ]; then ok=1; echo "    HTTP $code on 127.0.0.1:$published"; break; fi
    sleep 3
  done
  probed=1
  [ "$ok" = "1" ] || fail "published port $published never answered"
fi

if [ -n "$targets" ] && [ -n "$network" ]; then
  while read -r service port; do
    [ -n "${service:-}" ] || continue
    ok=0
    for _ in $(seq 1 20); do
      code="$(probe "$network" "$service" "$port")"
      # Any HTTP answer proves the app is serving. 401/403/302 are all fine:
      # they come from the app, which is the whole question being asked.
      if [ "$code" != "000" ]; then ok=1; echo "    HTTP $code on $service:$port"; break; fi
      sleep 3
    done
    probed=1
    [ "$ok" = "1" ] || fail "$service:$port never answered an HTTP request"
  done <<< "$targets"
fi

[ "$probed" = "1" ] || echo "    no HTTP entry point declared, skipping probe"

echo "PASS[$SLUG]"
