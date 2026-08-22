# Deploying the website

The website (https://stack.lol) is built and published by GitHub Actions to
GitHub Pages: [`.github/workflows/deploy-website.yml`](../.github/workflows/deploy-website.yml).

## How it works

1. `npm ci` at the repo root (npm workspaces).
2. `./packages/scripts/pack-stacks.sh` builds every `.stack` bundle into
   `packages/website/public/downloads/` (hub apps) and `.../downloads/recipes/`.
3. `npm run build` in `packages/website` produces `dist/` (~500MB, under the
   1GB Pages artifact limit).
4. `actions/upload-pages-artifact` + `actions/deploy-pages` publish it.

`packages/website/public/CNAME` carries the custom domain, so Pages keeps
`stack.lol` on every deployment.

`packages/website/public/releases` is intentionally not part of the build: the
download page redirects to GitHub Releases for the macOS app.

## Caching model

Packing all ~200 apps from scratch is slow, so `pack-stacks.sh` keeps a store of
bundles in `.cache/stacks` (override with `STACK_CACHE_DIR`):

- **Content-addressed** — an object is named after the git *tree* hash of its
  source directory (`hub-<slug>-<tree>.stack`). Recipe objects hash the recipe
  tree plus the tree of every `hub/<dep>` it includes.
- **Immutable** — a name always describes the same input, so a hit can be
  trusted without re-reading sources. Objects are written to `.tmp` and renamed,
  so a killed run never leaves a truncated object behind.
- **Reproducible** — GNU tar with `--sort=name --mtime=@0 --owner=0 --group=0
  --numeric-owner --format=gnu` piped through `gzip -9 -n`. Identical input
  yields byte-identical output, so downloads do not churn when nothing changed.

Objects are hard-linked into `public/downloads`, and anything in the store that
this run did not reference is pruned (keeps it around 60MB).

In CI the store is an `actions/cache` entry keyed on the hash of `hub/**`,
`recipes/**` and the two scripts. Any content change produces a new key (a new
immutable entry); `restore-keys: stacks-v1-<os>-` restores the newest previous
store, so only the changed apps are re-tarred.

Locally the script needs GNU tar. On macOS: `brew install gnu-tar` (it is picked
up as `gtar`). Run it with `make packitall-ci`.

## Schedule

Daily at 04:17 UTC, plus every push to `main` touching `hub/**`, `recipes/**`,
`packages/website/**`, `packages/scripts/**` or the workflow itself. The daily
run normally hits the cache key exactly, so packing is a no-op and only the
Astro build re-runs.

## Forcing a full rebuild

- Run the workflow manually from the Actions tab (`workflow_dispatch`), or
- bump the cache key prefix in the workflow from `stacks-v1-` to `stacks-v2-`
  (also update the `restore-keys` prefix) to discard the store entirely.

## One-time setup (manual)

1. **Settings > Pages > Source: GitHub Actions.**
2. **DNS for `stack.lol`** pointing at GitHub Pages:
   - `A` records for the apex: `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - `AAAA` records: `2606:50c0:8000::153`, `2606:50c0:8001::153`,
     `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` for `www` -> `codename-co.github.io`

   Then enable "Enforce HTTPS" once the certificate is issued.

## Fallback

The old path still works from a laptop with SSH access to the private server:

```sh
make deploy    # astro build + rsync dist to minicloud + docker-compose up
```

It is now the legacy/manual fallback only.
