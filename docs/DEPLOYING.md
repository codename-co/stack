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

## One-time setup

1. **Settings > Pages > Source: GitHub Actions** — done (`build_type: workflow`,
   custom domain `stack.lol`).
2. **DNS on Cloudflare** — see below.

### Cutting `stack.lol` over on Cloudflare

The zone is on Cloudflare and used to proxy the apex to the minicloud box.
Order matters: GitHub validates the domain over HTTP to issue the Let's Encrypt
certificate, and it cannot do that through the orange cloud — while proxied
without a certificate, Cloudflare answers **526**.

1. Replace the apex/`www` records with, both **DNS only** (grey cloud):

   | Type | Name | Content |
   | --- | --- | --- |
   | CNAME | `@` | `codename-co.github.io` |
   | CNAME | `www` | `codename-co.github.io` |

   Cloudflare flattens the apex CNAME automatically, and GitHub accepts it. The
   explicit alternative is four `A` records (`185.199.108-111.153`) plus the
   matching `AAAA` (`2606:50c0:8000-8003::153`).

2. **SSL/TLS > Overview > Full (strict)**. Never *Flexible*: Pages redirects
   HTTP to HTTPS, which would loop forever.
3. Wait for GitHub's DNS check, then for the certificate (minutes to ~1h), then
   tick **Enforce HTTPS**.
4. Optionally flip both records back to **Proxied** for caching and analytics.
   Pages sends `cache-control: max-age=600`, which Cloudflare honours, so the
   edge is at most 10 minutes stale after a deploy.

Notes:

- `public/_headers` is inert on Pages, which is harmless: Pages already returns
  `access-control-allow-origin: *` on every response, the only thing that file
  did. Anything more needs a Cloudflare Transform Rule (proxied mode only).
- Consider adding the `_github-pages-challenge-codename-co` TXT record
  (Settings > Pages > verified domains) so the domain cannot be claimed by
  another repository.

## Fallback

The old path still works from a laptop with SSH access to the private server:

```sh
make deploy    # astro build + rsync dist to minicloud + docker-compose up
```

It is now the legacy/manual fallback only.
