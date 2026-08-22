#!/bin/bash
set -euo pipefail

# Everything trusted here is generated per install on first launch and lives in
# the app's data directory. Nothing ships inside the app bundle, so this script
# resolves paths at run time rather than looking next to itself.
#
# Two certificates are installed:
#
#   1. cert.pem      — the loopback API's leaf (127.0.0.1:57404). Not a CA:
#                      trusting it grants no authority beyond localhost.
#   2. proxy/root.pem — the anchor of the local CA that signs
#                      *.stack.localhost. Its private key was destroyed right
#                      after it signed the issuing CA, and that issuing CA
#                      carries a critical nameConstraints extension limiting it
#                      to stack.localhost. Trusting it therefore cannot be used
#                      to vouch for any other host.
APP_ID="co.codename.stack"
CERT_DIR="$HOME/Library/Application Support/$APP_ID/certs"
API_CERT="$CERT_DIR/cert.pem"
PROXY_ANCHOR="$CERT_DIR/proxy/root.pem"
KEYCHAIN="/Library/Keychains/System.keychain"

# Must match tls::PROXY_CA_NAME.
CA_NAME="Stack Local CA"

if [ ! -f "$API_CERT" ] || [ ! -f "$PROXY_ANCHOR" ]; then
    echo "Certificate not found under: $CERT_DIR"
    echo "Start Stack once so it can generate one, then run this again."
    exit 1
fi

fingerprint() {
    # SHA-1 rather than SHA-256 only because `security -Z` on older macOS
    # prints nothing else. It is an identity check against the local keychain,
    # not a security boundary.
    openssl x509 -in "$1" -noout -fingerprint -sha1 | cut -d= -f2 | tr -d ':'
}

# Drops every keychain entry with this common name. Used to clear out anchors
# that were superseded by a rotation, so the trust store never accumulates
# certificates the app no longer uses.
forget() {
    local name="$1"
    while sudo security find-certificate -c "$name" "$KEYCHAIN" >/dev/null 2>&1; do
        sudo security delete-certificate -c "$name" -t "$KEYCHAIN" >/dev/null 2>&1 || break
    done
}

clear
echo ""
echo " 🔐 Installing the Stack certificates…"
echo ""
echo " ⚠️  You may be prompted to enter your password"
echo ""
echo "···············································"
echo ""

# Builds up to and including v0.x shipped a "Stack Root CA" whose private key
# was committed to the public repository — anyone holding it could impersonate
# any site to a machine that trusted it. Remove it, always, even if the user
# never asks to install anything.
forget "Stack Root CA"

# Superseded local anchors from an earlier rotation. Removing them first keeps
# the trust store holding exactly one Stack anchor: the one in use.
CURRENT="$(fingerprint "$PROXY_ANCHOR")"
forget "$CA_NAME"

# The API leaf: trusted for SSL only, and only able to speak for localhost.
sudo security add-trusted-cert -d -r trustRoot -p ssl -k "$KEYCHAIN" "$API_CERT"

# The local CA anchor: trusted for SSL only. The chain below it is name
# constrained to stack.localhost.
sudo security add-trusted-cert -d -r trustRoot -p ssl -k "$KEYCHAIN" "$PROXY_ANCHOR"

# Verify by fingerprint, not by name: a stale entry with the right common name
# would otherwise look like success.
if security find-certificate -a -Z -c "$CA_NAME" "$KEYCHAIN" 2>/dev/null |
    tr -d ' ' | grep -qi "$CURRENT"; then
    echo "✅ Certificates installed and trusted"
    echo ""
    echo "   Local API      https://127.0.0.1:57404"
    echo "   Local stacks   https://*.stack.localhost"
    echo ""
    echo "   Reload any open tab to pick up the new anchor."
else
    echo "❌ Failed to install the Stack Local CA anchor"
    exit 1
fi
