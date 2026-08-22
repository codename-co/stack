#!/bin/bash
#
# Trusts the local anchor minted by gen-cert.sh, so browsers stop warning on
# https://*.stack.localhost.
set -euo pipefail

CWD=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CERT_PATH="$CWD/../certs/root.pem"
CERT_NAME="Stack Local CA"
KEYCHAIN="/Library/Keychains/System.keychain"

if [ ! -f "$CERT_PATH" ]; then
    echo "Anchor not found: $CERT_PATH"
    echo "Run ./scripts/gen-cert.sh first."
    exit 1
fi

# Versions of this stack up to v0.x shipped a "Stack Root CA" whose private key
# was committed to the public repository — anyone holding it could impersonate
# any site to a machine that trusted it. Drop it, unconditionally.
while sudo security find-certificate -c "Stack Root CA" "$KEYCHAIN" >/dev/null 2>&1; do
    sudo security delete-certificate -c "Stack Root CA" -t "$KEYCHAIN" >/dev/null 2>&1 || break
done

sudo security add-trusted-cert -d -r trustRoot -p ssl -k "$KEYCHAIN" "$CERT_PATH"

# Check by fingerprint, not by name: a stale entry with the right common name
# would otherwise look like success.
CURRENT=$(openssl x509 -in "$CERT_PATH" -noout -fingerprint -sha1 | cut -d= -f2 | tr -d ':')
if security find-certificate -a -Z -c "$CERT_NAME" "$KEYCHAIN" 2>/dev/null |
    tr -d ' ' | grep -qi "$CURRENT"; then
    echo "✅ Certificate successfully installed and trusted"
else
    echo "❌ Failed to install certificate"
    exit 1
fi
