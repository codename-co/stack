.DEFAULT_GOAL := help

# ---------------------------------------------------------------------------
# macOS app release configuration
#
# Every credential is read from the environment so these targets behave
# identically on a laptop and on a GitHub Actions runner. Nothing secret is
# stored in this file. See docs/RELEASING.md for the full list.
# ---------------------------------------------------------------------------

# Single source of truth for the version: the Tauri config.
APP_VERSION := $(shell node -p "require('./packages/app/src-tauri/tauri.conf.json').version")

# Universal (Intel + Apple Silicon) build. Requires both rustup targets.
MACOS_TARGET := universal-apple-darwin
BUNDLE_DIR := packages/app/src-tauri/target/$(MACOS_TARGET)/release/bundle
APP := $(BUNDLE_DIR)/macos/Stack.app
DMG := $(BUNDLE_DIR)/dmg/Stack_$(APP_VERSION)_universal.dmg

# Updater signing key. Tauri accepts either a path or the key material itself,
# so CI can inject the key as a secret without touching the filesystem.
TAURI_SIGNING_PRIVATE_KEY ?= $(HOME)/.tauri/stack.key
TAURI_SIGNING_PRIVATE_KEY_PASSWORD ?=
export TAURI_SIGNING_PRIVATE_KEY
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD

# Apple credentials. APPLE_PASSWORD is an app-specific password and must come
# from the environment (a secret in CI, your keychain/shell locally).
# These are only exported when a password is actually present: Tauri triggers
# notarization as soon as it sees the trio set, so exporting them empty would
# turn every credential-less build into a 401 failure.
APPLE_ID ?= arnaud.leymet@gmail.com
APPLE_TEAM_ID ?= VUL6HVKT5X

# Locally the app-specific password is read from the macOS keychain, so it never
# lives in a file, in shell history, or in this repo. CI overrides it with a
# repository secret. Run `make keychain-store` once to populate the item.
APPLE_KEYCHAIN_ITEM ?= stack-notary
APPLE_PASSWORD ?= $(shell security find-generic-password -s $(APPLE_KEYCHAIN_ITEM) -w 2>/dev/null)

ifneq ($(APPLE_PASSWORD),)
export APPLE_ID
export APPLE_TEAM_ID
export APPLE_PASSWORD
endif

# Fails with a readable message instead of producing a broken artifact.
guard-%:
	@if [ -z "$${$*}" ]; then echo "error: $* is not set (see docs/RELEASING.md)"; exit 1; fi

help:                 ## Show this help.
	@printf "\nUsage: make $$(tput bold)<command>$$(tput sgr0)\n\nThe following commands are available:\n\n"
	@fgrep -h "##" $(MAKEFILE_LIST) | sed -e 's/\(\:.*\#\#\)/\:\ /' | fgrep -v fgrep | sed $$'s/^/make \e[1m/' | sed $$'s/: /\e[0m\t/' | expand -t 38 | sed -e 's/\\$$//' | sed -e 's/##//'
	@printf "\n"

pack:
	@find hub -type d -depth 1 -exec sh -c 'cd {} && stack pack' \;

inspect:
	@find hub -type d -depth 1 -exec sh -c 'cd {} && stack run {}.stack' \;

run:
	@find hub -type d -depth 1 -exec sh -c 'cd {} && stack run {}.stack' \;

packitall:
	@find hub -type d -depth 1 -exec sh -c 'cd {} && tar --exclude="*.stack" -czf "../../packages/website/public/downloads/$$(basename {}).stack" .' \;
	@./packages/scripts/bundle-recipe.ts
	@find recipes/.dist -type d -depth 1 -exec sh -c 'cd {} && tar --exclude="*.stack" -czf "../../../packages/website/public/downloads/recipes/$$(basename {}).stack" .' \;

packitall-ci:             ## Build every .stack bundle incrementally (used by CI)
	@bash ./packages/scripts/pack-stacks.sh


minicloud-ssh:             ## SSH into the minicloud server
	@ssh -t minicloud "cd /apps/stack ; bash --login"

minicloud-start:           ## Start the minicloud service
	@ssh -t minicloud "cd /apps/stack ; docker-compose up --build --remove-orphans -d"

minicloud-sync:            ## Sync files with the minicloud server
	@cd packages/website && rsync -av --delete --exclude='*/node_modules' dist minicloud:/apps/stack/
	@ssh minicloud "find /apps/stack/dist -type d -exec chmod 755 {} + && find /apps/stack/dist -type f -exec chmod 644 {} +"

website-build:
	@cd packages/website && npm run build

# Legacy/manual fallback: CI deploys via .github/workflows/deploy-website.yml.
deploy: website-build minicloud-sync minicloud-start


translate:
	@ANTHROPIC_API_KEY=... ./packages/scripts/generate_i18n.ts



version:                  ## Print the app version (single source of truth)
	@echo $(APP_VERSION)

toolchain:               ## Install the rustup targets needed for a universal macOS build
	@rustup target add aarch64-apple-darwin x86_64-apple-darwin

build: toolchain          ## Build+sign the macOS app as a universal (Intel + Apple Silicon) binary
	@cd packages/app && npm run tauri build -- --target $(MACOS_TARGET)

build-unsigned: toolchain ## Build a universal binary with ad-hoc signing (no Developer ID, no notarization)
	@cd packages/app && env -u APPLE_ID -u APPLE_PASSWORD -u APPLE_TEAM_ID APPLE_SIGNING_IDENTITY="-" npm run tauri build -- --target $(MACOS_TARGET)

bundle: toolchain         ## Re-bundle + notarize an already-built app
	@cd packages/app && npm run tauri bundle -- --target $(MACOS_TARGET)

verify-arch:              ## Check that the built app really contains both architectures
	@lipo -archs "$(APP)/Contents/MacOS/stack"
	@lipo -archs "$(APP)/Contents/MacOS/stack" | grep -q x86_64 || (echo "error: missing Intel slice"; exit 1)
	@lipo -archs "$(APP)/Contents/MacOS/stack" | grep -q arm64  || (echo "error: missing Apple Silicon slice"; exit 1)
	@echo "ok: universal binary"

keychain-store:           ## Store the Apple app-specific password in the macOS keychain
	@echo "Paste the app-specific password from appleid.apple.com when prompted."
	@security add-generic-password -U -a "$(APPLE_ID)" -s "$(APPLE_KEYCHAIN_ITEM)" -w \
		&& echo "stored in keychain as '$(APPLE_KEYCHAIN_ITEM)'"

doctor:                   ## Check every prerequisite for a signed, notarized release
	@echo "Release prerequisites:"
	@printf '  %-28s' "rust targets"; \
		if rustup target list --installed 2>/dev/null | grep -q x86_64-apple-darwin && \
		   rustup target list --installed 2>/dev/null | grep -q aarch64-apple-darwin; \
		then echo "ok"; else echo "MISSING (run: make toolchain)"; fi
	@printf '  %-28s' "updater key"; \
		if [ -n "$$TAURI_SIGNING_PRIVATE_KEY" ] && [ -f "$$TAURI_SIGNING_PRIVATE_KEY" ]; \
		then echo "ok ($$TAURI_SIGNING_PRIVATE_KEY)"; \
		elif [ -n "$$TAURI_SIGNING_PRIVATE_KEY" ]; then echo "ok (from environment)"; \
		else echo "MISSING - auto-updates cannot be signed"; fi
	@printf '  %-28s' "Developer ID cert"; \
		if security find-identity -v -p codesigning 2>/dev/null | grep -q "Developer ID Application"; \
		then echo "ok"; else echo "MISSING - cannot produce a distributable build (see docs/RELEASING.md)"; fi
	@printf '  %-28s' "notarization password"; \
		if [ -n "$(APPLE_PASSWORD)" ]; then echo "ok (keychain: $(APPLE_KEYCHAIN_ITEM))"; \
		else echo "MISSING (run: make keychain-store)"; fi
	@printf '  %-28s' "Apple agreements"; \
		if [ -z "$(APPLE_PASSWORD)" ]; then echo "skipped (no password)"; \
		else out=$$(xcrun notarytool history --apple-id "$(APPLE_ID)" --password "$(APPLE_PASSWORD)" --team-id "$(APPLE_TEAM_ID)" 2>&1); \
			if [ $$? -eq 0 ]; then echo "ok"; \
			else case "$$out" in \
				*403*|*agreement*) echo "UNSIGNED AGREEMENT (see: make keychain-check)" ;; \
				*401*) echo "REJECTED (see: make keychain-check)" ;; \
				*) echo "ERROR (see: make keychain-check)" ;; \
			esac; fi; fi

keychain-check:           ## Verify the keychain holds a password and Apple accepts it
	@if [ -z "$(APPLE_PASSWORD)" ]; then \
		echo "no password in keychain (run: make keychain-store)"; exit 1; \
	fi
	@echo "keychain item '$(APPLE_KEYCHAIN_ITEM)' found for $(APPLE_ID)"
	@out=$$(xcrun notarytool history --apple-id "$(APPLE_ID)" --password "$(APPLE_PASSWORD)" --team-id "$(APPLE_TEAM_ID)" 2>&1); \
	if [ $$? -eq 0 ]; then \
		echo "Apple accepted the credentials"; \
	else \
		echo "$$out" >&2; \
		case "$$out" in \
			*401*) echo "" >&2; \
				echo "-> The password is wrong or revoked." >&2; \
				echo "   Issue a new app-specific password at https://appleid.apple.com" >&2; \
				echo "   then run: make keychain-store" >&2 ;; \
			*403*|*agreement*) echo "" >&2; \
				echo "-> The password is FINE. Your Apple team has an unsigned or expired agreement." >&2; \
				echo "   Do NOT revoke the password - it would not help." >&2; \
				echo "   Sign in as Account Holder at https://appstoreconnect.apple.com" >&2; \
				echo "   then: Business -> Agreements, and accept any pending agreement." >&2; \
				echo "   Also check https://developer.apple.com/account for a review banner." >&2 ;; \
			*) echo "" >&2; echo "-> Unexpected error, see the message above." >&2 ;; \
		esac; \
		exit 1; \
	fi

keychain-forget:          ## Remove the stored password from the keychain
	@security delete-generic-password -s "$(APPLE_KEYCHAIN_ITEM)" >/dev/null 2>&1 \
		&& echo "removed '$(APPLE_KEYCHAIN_ITEM)' from keychain" || echo "nothing to remove"

notarize: guard-APPLE_PASSWORD  ## Notarize and staple the built DMG
	@xcrun notarytool submit '$(DMG)' --apple-id="$(APPLE_ID)" --password="$(APPLE_PASSWORD)" --team-id="$(APPLE_TEAM_ID)" --wait
	@xcrun stapler staple '$(DMG)'
	@spctl -a -t open --context context:primary-signature -v '$(DMG)'

publish:                  ## Copy the notarized DMG into the website release folder
	@mkdir -p ./packages/website/public/releases
	@cp '$(DMG)' ./packages/website/public/releases/

release: build verify-arch notarize publish  ## Full local release pipeline

check: guard-SUBMISSION_ID guard-APPLE_PASSWORD  ## Show the notarization log for SUBMISSION_ID
	@xcrun notarytool log $(SUBMISSION_ID) --apple-id="$(APPLE_ID)" --password="$(APPLE_PASSWORD)" --team-id="$(APPLE_TEAM_ID)"

logs:
	@tail -f ~/Library/Logs/co.codename.stack/logs.log | grep stack_lib
