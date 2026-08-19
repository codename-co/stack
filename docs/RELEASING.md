# Releasing the macOS app

The app ships as a **universal binary** (`x86_64` + `arm64`), so a single DMG
runs natively on both Intel and Apple Silicon Macs. Anything that produces an
`aarch64`-only artifact is a regression — `make verify-arch` exists to catch it.

There are two paths: **CI** (preferred) and **local** (fallback). Both run the
same commands, because the Makefile reads all credentials from the environment.

---

## Release via GitHub Actions (preferred)

1. Bump the version in **both** `packages/app/src-tauri/tauri.conf.json` and
   `packages/app/src-tauri/Cargo.toml`.
2. Commit, then tag and push:

   ```sh
   git tag app-v$(make version)
   git push origin app-v$(make version)
   ```

3. `.github/workflows/release-app.yml` builds, signs, notarizes, verifies both
   architectures, and publishes a **draft** GitHub Release with the DMG, the
   updater tarball, its signature, and `latest.json`.
4. Review the draft release and publish it.

The workflow refuses to run if the tag and `tauri.conf.json` disagree, so a
mismatched release can't be published by accident.

### Required repository secrets

| Secret | What it is | How to get it |
| --- | --- | --- |
| `APPLE_CERTIFICATE` | Developer ID Application cert, `.p12`, base64 | see below |
| `APPLE_CERTIFICATE_PASSWORD` | password set when exporting the `.p12` | you choose it at export time |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: WAREHOUSE SAS (VUL6HVKT5X)` | `security find-identity -v -p codesigning` |
| `APPLE_ID` | Apple developer account email | — |
| `APPLE_PASSWORD` | **app-specific** password, not the account password | <https://appleid.apple.com> → Sign-In and Security → App-Specific Passwords |
| `APPLE_TEAM_ID` | `VUL6HVKT5X` | Apple Developer portal → Membership |
| `TAURI_SIGNING_PRIVATE_KEY` | contents of the minisign updater key | `cat ~/.tauri/stack.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | its passphrase (currently empty) | — |

Exporting the signing certificate:

```sh
# Keychain Access → My Certificates → right-click the "Developer ID
# Application" cert → Export → .p12, then:
base64 -i DeveloperID.p12 | pbcopy
```

Paste that into the `APPLE_CERTIFICATE` secret. Delete the local `.p12`
afterwards — `.gitignore` blocks `*.p12`, but don't leave it lying around.

> The `TAURI_SIGNING_PRIVATE_KEY` is the only copy of the updater identity.
> If it is lost, existing installs can no longer auto-update and every user
> has to reinstall manually. Keep an offline backup.

---

## Release locally (fallback)

Needs the Developer ID certificate in your login keychain and
`~/.tauri/stack.key` present.

```sh
make keychain-store   # prompts; input is not echoed and never reaches argv
make keychain-check   # confirms Apple actually accepts it
make release          # build → verify → notarize → publish
```

The app-specific password is read from the macOS keychain, so it never lives in
a file, an env var, or your shell history. CI overrides it with a secret.

`make release` chains the individual targets, which can also be run alone:

| Target | Purpose |
| --- | --- |
| `make version` | print the version from `tauri.conf.json` |
| `make toolchain` | install both rustup targets |
| `make build` | universal build, Developer ID signed |
| `make build-unsigned` | universal build, ad-hoc signed — for local testing without a certificate |
| `make verify-arch` | assert the app contains **both** slices; fails otherwise |
| `make notarize` | submit, wait, staple, and verify with `spctl` |
| `make publish` | copy the DMG into `packages/website/public/releases/` |
| `make check SUBMISSION_ID=…` | fetch a notarization log |
| `make doctor` | check every release prerequisite at once |
| `make keychain-store` / `keychain-check` / `keychain-forget` | manage the stored Apple password |

Run `make doctor` before a release; it reports each prerequisite independently
so a missing one is obvious before a 20-minute build.

No credentials are hardcoded in the Makefile. Targets that need a secret fail
immediately with a readable message rather than emitting a broken artifact.

---

### Recovering a missing Developer ID certificate

`make doctor` reports `Developer ID cert MISSING` when neither the certificate
nor its private key is in the login keychain. Signing is impossible until it is
restored — locally *and* in CI, since the `APPLE_CERTIFICATE` secret is an
export of this same certificate.

**First, look for it before replacing it.** The private key cannot be
re-downloaded from Apple; only the machine that generated the CSR, a keychain
backup, or an existing `.p12` has it.

```sh
security find-identity -v -p codesigning        # on any other Mac you use
```

If you find it, export from Keychain Access → My Certificates → right-click the
**Developer ID Application** entry → Export → `.p12`. Expand the entry first: if
it has no disclosure triangle, the private key is absent and that copy is
unusable for signing.

**If it is genuinely lost**, create a replacement at
<https://developer.apple.com/account/resources/certificates> → **+** →
Developer ID Application. This requires the Account Holder role.

> Create an *additional* certificate — do not revoke the old one. Revocation
> invalidates the signature on every copy of the app already distributed, and
> Gatekeeper will start refusing them. Ordinary *expiry* is harmless by
> comparison: builds that were timestamped and notarized keep validating after
> the certificate expires. Only revoke if the private key is known to be
> compromised. Apple caps Developer ID Application certificates per account
> (currently 5), so check the existing list before generating another.

Once you hold the `.p12`, you never need it on a laptop again — base64 it into
the `APPLE_CERTIFICATE` secret and let CI do the signing.

---

## Rotating the Apple app-specific password

An app-specific password grants notarization access to the developer account.
Rotate one whenever it has been written to a file, pasted into a chat, an issue
or a support ticket, shared with a contractor, or committed anywhere.

1. **Revoke the old one.** <https://appleid.apple.com> → Sign-In and Security →
   App-Specific Passwords → select the entry → Revoke. This is the step that
   actually fixes the exposure; everything else is cleanup.
2. **Issue a new one** on the same page.
3. **Store it in the keychain**, not in a file:
   ```sh
   make keychain-store
   make keychain-check   # expect "Apple accepted the credentials"
   ```
4. **Update the `APPLE_PASSWORD` repository secret** in GitHub settings.
5. **Confirm the old value is nowhere else:**
   ```sh
   git grep -I '<old-password>' $(git rev-list --all)    # expect no output
   grep -rIl '<old-password>' . --exclude-dir=node_modules --exclude-dir=target
   grep -c '<old-password>' ~/.zsh_history ~/.bash_history
   ```

If a secret ever does reach a commit, revoking is still step one: rewriting
history does not help, since anyone who cloned the repo — and GitHub's own fork
and cache infrastructure — may still hold the object.

### Reading notarization failures

`make keychain-check` distinguishes the two failures that look alike:

| Response | Meaning | Action |
| --- | --- | --- |
| `401 Invalid credentials` | the password is wrong, revoked, or the wrong Apple ID / team | issue a new app-specific password, `make keychain-store` |
| `403 A required agreement is missing or has expired` | **the password is fine** — Apple authenticated you, then refused because the team has an unsigned or expired legal agreement | sign the agreement; revoking the password does nothing |

For a 403: sign in as the **Account Holder** at
<https://appstoreconnect.apple.com> → Business → Agreements and accept whatever
is pending, then check <https://developer.apple.com/account> for a banner about
the Apple Developer Program License Agreement. Apple reissues this agreement
periodically, so a pipeline that worked last quarter can start returning 403
with no change on your side. Only the Account Holder can accept it — admins and
developers cannot.

Notarization stays blocked until the agreement is signed, so this breaks CI and
local releases identically.

### Preferring an API key over a password

For CI, an App Store Connect API key is a better fit than a personal
app-specific password: it is scoped, individually revocable, and not tied to
your Apple ID login. Tauri accepts `APPLE_API_KEY`, `APPLE_API_ISSUER` and
`APPLE_API_KEY_PATH` instead of the `APPLE_ID` / `APPLE_PASSWORD` /
`APPLE_TEAM_ID` trio. Worth migrating to once the current pipeline is proven.

### Building without a certificate

To verify a build on a machine with no signing identity:

```sh
make build-unsigned verify-arch
```

The resulting DMG is fine for local testing but will trip Gatekeeper for
anyone else — it is not distributable.

---

## Distribution

Artifacts are published to **GitHub Releases**, which is also what the
in-app updater and the website point at:

- `packages/website/src/pages/[...lang]/download/mac.astro` reads the version
  from `tauri.conf.json` and redirects to the matching release asset. There is
  no version string to update by hand.
- The updater in `tauri.conf.json` checks
  `https://github.com/codename-co/stack/releases/latest/download/latest.json`
  first, then falls back to the legacy `stack.lol` endpoints so that clients
  installed before this change keep working.

Because the website links to GitHub, DMGs no longer need to be rsynced to
minicloud. `make publish` remains for the legacy `stack.lol` paths.

---

## Checklist for a good release

- [ ] version bumped in `tauri.conf.json` **and** `Cargo.toml`
- [ ] `make verify-arch` prints `ok: universal binary`
- [ ] notarization succeeded and the DMG is stapled (`make notarize` runs `spctl`)
- [ ] `latest.json` is attached to the GitHub Release
- [ ] the DMG has been opened once on an **Intel** Mac, not just Apple Silicon
