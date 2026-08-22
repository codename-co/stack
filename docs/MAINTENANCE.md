# Keeping the catalogue true

Every entry in `hub/` makes factual claims about a piece of software: how many
stars it has, who publishes it, under what licence, where it lives, which
version we ship and when that version came out.

Those claims rot silently. Nothing in this repository changes when a project
relicenses, gets renamed, or cuts a release — the files stay exactly as they
were while the facts move on. A catalogue that quietly drifts out of date is
worse than no catalogue, because people trust it.

This document describes the machinery that keeps it honest, and — more
importantly — why it is split in two.

## The split

|                    | Descriptive metadata                                     | Versions                                             |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------- |
| Fields             | `stars`, `homepage`, `repository`, `license`, `updated_at` | `version`, the `${VAR:-x.y.z}` pin in `compose.yaml`  |
| If it is wrong     | A user is misinformed                                     | A user's install breaks                               |
| Verifiable by API  | Yes                                                       | No                                                    |
| Applied            | Automatically, daily, as one PR                           | Never automatically                                   |
| Tool               | `sync-metadata.ts`                                        | `check-versions.ts` → `test-stack.sh`                 |

The asymmetry is the whole point. A star count is just a number: fetch it,
write it, done. A version is a decision about what code runs on someone's
machine. The GitHub API can tell you that `26.8.1` exists; it cannot tell you
that `26.8.1` still starts with our `compose.yaml`, still reads our `.env`, and
still finds its data where `25.4.0` left it. Only booting it can tell you that.

So versions are never bumped by the sync. They are *detected*, turned into a
work order, and applied by a task that must prove the result works.

## Descriptive metadata

```bash
make hub-sync              # refresh everything
make hub-sync APP=affine   # one app
make hub-check             # report drift, write nothing, exit 1 if stale
```

Runs daily in [`hub-maintenance.yml`](../.github/workflows/hub-maintenance.yml)
and lands as a single PR on the `chore/hub-metadata` branch, force-pushed each
run so the PR always shows the diff against today's upstream rather than a
chain of superseded star counts.

### Applied vs proposed

Not every upstream field is equally authoritative, because the hub and the
forge describe **different things**: a hub entry describes a piece of software,
the API describes a repository. Usually the same thing — but not always:

- `hub/factorio` points at `factoriotools/factorio-docker`, whose MIT licence
  covers the Dockerfile. The game is proprietary.
- `hub/wordpress` points at `wordpress-develop`, whose homepage field is a
  contributor handbook, not wordpress.org.

So the sync applies what the API is authoritative about and proposes the rest:

- **Applied** — `stars`, `repository`, `updated_at`. A star count is a star
  count; a differing canonical URL means the project genuinely moved (GitHub
  resolves renames, which is how `fallenbagel/jellyseerr` → `seerr-team/seerr`
  was caught).
- **Proposed** — `license`, `homepage`. Applied when the field is empty (pure
  gain), otherwise listed for review.

A proposal is resolved once and stays resolved:

```bash
# take the upstream value
node packages/scripts/maintenance/sync-metadata.ts --accept zitadel:license

# keep ours, and stop being asked
node packages/scripts/maintenance/sync-metadata.ts --reject wordpress:homepage \
  --reason "wordpress-develop's homepage is the contributor handbook"
```

Rejections live in [`hub/metadata-overrides.yaml`](../hub/metadata-overrides.yaml)
with their reason, and are **pinned to the value that was rejected** — if
upstream later publishes something different, the question comes back. Without
this, the same wrong suggestion returns every morning until the report becomes
noise nobody reads.

### `updated_at`

`updated_at` is the release date of the version we ship, so the pair
(`version`, `updated_at`) always describes one and the same release.

For a pinned version it comes from that release's publication date, and from
nowhere else. In particular it never falls back to "when upstream last pushed":
writing today's date next to a two-year-old pin would manufacture a freshness
the entry does not have. Only rolling tags (`latest`, `stable-<sha>`), which
have no release of their own, use the registry push date of the exact tag we
ship.

Dates never move backwards — a later value may have been set by a human who
knew better than the API.

## Versions

```bash
make hub-versions              # what is behind upstream?
make hub-versions APP=gitea
```

`check-versions.ts` **never edits a file**. It resolves the latest *stable*
release (highest version, not merely the most recently published one — projects
backport to old branches), confirms a matching container tag actually exists,
and emits a work order: the exact edits to make, in which files, plus the
release notes to read first.

Releases younger than three days are ignored, because fresh releases get
yanked.

CI files these as GitHub issues labelled `upgrade`: one always-current summary
issue, plus a few individual work orders at a time. The trickle is deliberate —
each upgrade has to be booted and probed to be validated, so filing 150 issues
at once would create a queue nobody can drain and would bury the two or three
that matter.

### The gate

```bash
make hub-test APP=gitea
```

`test-stack.sh` is what makes an upgrade safe to merge. It:

1. resolves the compose file,
2. pulls every image (a release with no published image is a real blocker),
3. waits for every service to become healthy,
4. watches for crash-loops through a settle window — `--wait` returns as soon
   as containers are up, and apps that fail on their first real request die a
   few seconds later,
5. makes a real HTTP request to the app's entry point.

Step 5 matters more than it looks. "All containers are running" is a weak
signal: a web app whose frontend failed to boot still leaves a happy container
behind. Most hub apps publish no port — they are reached through the Stack proxy
via their `traefik...loadbalancer.server.port` label — so the probe reads that
same label and requests the app from inside the compose network, which is the
path real traffic takes.

Everything runs under a throwaway project name with volumes in a temp
directory, so a test never touches what you are running locally, and cleans up
on any exit.

**Always take a baseline first:**

```bash
./packages/scripts/maintenance/test-stack.sh gitea   # before the bump
# apply the work order, then
./packages/scripts/maintenance/test-stack.sh gitea   # after
```

An app that was already failing is not a regression from this bump, and
blocking on it would freeze the catalogue forever. What must never happen is a
bump that turns a passing app into a failing one.

## Files

```
packages/scripts/maintenance/
├── sync-metadata.ts     # safe fields → applied
├── check-versions.ts    # version drift → work orders, never edits
├── file-upgrades.ts     # work orders → GitHub issues
├── test-stack.sh        # the gate every version bump must pass
└── lib/
    ├── upstream.ts      # GitHub/Codeberg/GitLab + Docker Hub/GHCR/Quay
    ├── hub.ts           # reading hub entries, patching single YAML fields
    └── overrides.ts     # curation decisions upstream must not overwrite

hub/metadata-overrides.yaml   # rejected suggestions, with reasons
```

The scripts run on plain Node ≥ 22 with native TypeScript stripping: no build
step, and no dependency beyond `yaml`.

`stack.yaml` files are edited by patching individual lines rather than by
parsing and re-serialising. These files are hand-curated — SPDX header, schema
comment, field order, inline notes — and a round-trip would silently reflow all
of that, turning a one-field refresh into an unreviewable diff.

Locally the scripts borrow the `gh` CLI's token, so no `GITHUB_TOKEN` export is
needed. Responses are cached under `.cache/upstream` for six hours, which makes
a re-run free.
