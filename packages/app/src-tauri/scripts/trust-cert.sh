#!/bin/bash
set -e

# The certificate is generated per-install on first launch and lives in the
# app's data directory — it is not bundled with the app, so this script
# resolves it at run time rather than looking next to itself.
APP_ID="co.codename.stack"
CERT_PATH="$HOME/Library/Application Support/$APP_ID/certs/cert.pem"
CERT_NAME="localhost"
KEYCHAIN="/Library/Keychains/System.keychain"

if [ ! -f "$CERT_PATH" ]; then
    echo "Certificate not found: $CERT_PATH"
    echo "Start Stack once so it can generate one, then run this again."
    exit 1
fi

clear
echo ""
echo " 🔐 Installing the Stack certificate…"
echo ""
echo " ⚠️  You may be prompted to enter your password"
echo ""
echo "···············································"
echo ""

# Older builds shipped a "Stack Root CA" that never actually signed the API
# certificate. Remove it so it stops sitting in the system trust store.
while sudo security find-certificate -c "Stack Root CA" "$KEYCHAIN" >/dev/null 2>&1; do
    sudo security delete-certificate -c "Stack Root CA" "$KEYCHAIN" >/dev/null 2>&1 || break
done

# Trust this one leaf certificate for SSL. It is not a CA, so it can only ever
# vouch for the local API on 127.0.0.1:57404 — not for any other host.
sudo security add-trusted-cert -d -r trustRoot -p ssl -k "$KEYCHAIN" "$CERT_PATH"

# Verify
if security find-certificate -c "$CERT_NAME" "$KEYCHAIN" >/dev/null 2>&1; then
    echo "✅ Certificate successfully installed and trusted"
else
    echo "❌ Failed to install certificate"
    exit 1
fi
