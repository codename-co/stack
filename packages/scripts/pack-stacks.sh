#!/usr/bin/env bash
set -euo pipefail

# Build every `.stack` bundle (hub apps + recipes) incrementally.
#
# This replaces `make packitall`, which re-tarred all ~200 apps on every run.
# Here each bundle is content-addressed: the object name embeds the git tree
# hash of its source directory, so a bundle that already exists in the store is
# never rebuilt. On CI the store is an actions/cache entry, which turns a
# typical push (one app changed) into one tar instead of two hundred, and the
# daily scheduled run into a no-op.
#
# Two properties make that safe:
#   - objects are immutable: a given name always describes the same input, so a
#     cache hit can be trusted without re-reading the sources;
#   - tars are reproducible: identical input yields byte-identical output, so
#     the downloads served by the website do not churn when nothing changed.
#
# Safe to run locally and idempotent. Override the store with STACK_CACHE_DIR.

STORE="${STACK_CACHE_DIR:-.cache/stacks}"
OUT="packages/website/public/downloads"

# The deterministic flags below (--sort, --mtime, --owner/--group,
# --numeric-owner, --format=gnu) are GNU tar only; that is what ubuntu runners
# ship. macOS ships bsdtar as `tar`, which silently lacks --sort, so we require
# GNU tar explicitly rather than produce non-reproducible archives.
TAR="$(command -v gtar || command -v tar)"
if ! "$TAR" --version 2>/dev/null | head -1 | grep -qi 'GNU tar'; then
  echo "error: GNU tar is required (found: ${TAR})" >&2
  echo "       on macOS: brew install gnu-tar   (provides 'gtar')" >&2
  exit 1
fi

mkdir -p "$STORE" "$OUT" "$OUT/recipes"

# Every object referenced by this run; anything else in the store is stale.
REFS="$(mktemp)"
trap 'rm -f "$REFS"' EXIT

reused=0
rebuilt=0

# Content id of a directory. A git tree hash is exact (it covers every tracked
# byte and the file layout) and costs nothing since git already computed it.
# Untracked or dirty directories have no tree object, so we fall back to hashing
# the working copy — that path only happens locally, never in CI.
content_key() {
  local dir="$1"
  if git rev-parse --quiet --verify "HEAD:$dir" 2>/dev/null; then
    return 0
  fi
  find "$dir" -type f ! -name '*.stack' -print0 |
    LC_ALL=C sort -z |
    xargs -0 shasum -a 256 2>/dev/null |
    shasum -a 256 |
    cut -c1-40
}

# Deterministic archive of $2 into object $1. Written to a temporary file and
# renamed, so a killed run can never leave a truncated object behind that a
# later run would happily treat as a cache hit.
# gzip -9 -n: -n drops the timestamp/name, which would otherwise differ per run.
pack() {
  local obj="$1" src="$2"
  "$TAR" --exclude='*.stack' --sort=name --mtime='@0' \
    --owner=0 --group=0 --numeric-owner --format=gnu \
    -cf - -C "$src" . | gzip -9 -n >"$obj.tmp"
  mv "$obj.tmp" "$obj"
}

# Publish an object into the website's public folder. A hard link keeps the
# store and the output in sync for free; cp is the fallback when they live on
# different filesystems.
publish() {
  local obj="$1" dest="$2"
  ln -f "$obj" "$dest" 2>/dev/null || cp -f "$obj" "$dest"
}

# --- hub apps --------------------------------------------------------------

for dir in hub/*/; do
  [ -d "$dir" ] || continue
  slug="$(basename "$dir")"
  key="$(content_key "hub/$slug")"
  obj="$STORE/hub-$slug-$key.stack"
  echo "hub-$slug-$key.stack" >>"$REFS"

  if [ -f "$obj" ]; then
    reused=$((reused + 1))
  else
    pack "$obj" "hub/$slug"
    rebuilt=$((rebuilt + 1))
  fi
  publish "$obj" "$OUT/$slug.stack"
done

# --- recipes ---------------------------------------------------------------

# A recipe bundle is the recipe plus a copy of every hub app it includes, so its
# identity depends on all of them: key = hash(recipe tree + each dep tree). The
# dependency list comes from the `include:` entries of the recipe compose file,
# which lets us decide whether anything needs rebuilding *before* paying for
# bundle-recipe.ts (it shells out to `cp -R` for every recipe).
recipe_key() {
  local slug="$1" material
  material="$(content_key "recipes/$slug")"
  while read -r dep; do
    [ -n "$dep" ] || continue
    [ -d "hub/$dep" ] || continue
    material="$material$(content_key "hub/$dep")"
  done < <(sed -n 's#^[[:space:]]*-[[:space:]]*\.\./\.\./hub/\([^/]*\)/compose\.yaml.*#\1#p' \
    "recipes/$slug/compose.yaml")
  printf '%s' "$material" | shasum -a 256 | cut -c1-40
}

recipes=()
missing=0
for dir in recipes/*/; do
  [ -d "$dir" ] || continue
  slug="$(basename "$dir")"
  case "$slug" in .*) continue ;; esac
  [ -f "recipes/$slug/compose.yaml" ] || continue
  key="$(recipe_key "$slug")"
  recipes+=("$slug:$key")
  echo "recipe-$slug-$key.stack" >>"$REFS"
  [ -f "$STORE/recipe-$slug-$key.stack" ] || missing=1
done

if [ "$missing" -eq 1 ]; then
  # bundle-recipe.ts materialises recipes/.dist/<slug>/ with the hub apps copied
  # in. Only worth running when at least one recipe object is missing.
  npx --yes tsx packages/scripts/bundle-recipe.ts >/dev/null
fi

for entry in "${recipes[@]:-}"; do
  [ -n "$entry" ] || continue
  slug="${entry%%:*}"
  key="${entry##*:}"
  obj="$STORE/recipe-$slug-$key.stack"

  if [ -f "$obj" ]; then
    reused=$((reused + 1))
  else
    pack "$obj" "recipes/.dist/$slug"
    rebuilt=$((rebuilt + 1))
  fi
  publish "$obj" "$OUT/recipes/$slug.stack"
done

# --- prune -----------------------------------------------------------------

# Without this the store would grow by one object per app per edit forever, and
# the CI cache entry (which is uploaded whole) with it. Keeps it at ~60MB.
pruned=0
for obj in "$STORE"/*.stack; do
  [ -e "$obj" ] || continue
  if ! grep -qxF "$(basename "$obj")" "$REFS"; then
    rm -f "$obj"
    pruned=$((pruned + 1))
  fi
done
rm -f "$STORE"/*.tmp

printf 'stacks: %d reused, %d rebuilt, %d pruned — store %s (%s)\n' \
  "$reused" "$rebuilt" "$pruned" "$(du -sh "$STORE" | cut -f1)" "$STORE"
