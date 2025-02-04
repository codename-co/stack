#!/bin/bash
set -e

CWD=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CERT_PATH="$CWD/../certs/root.cer"
CERT_NAME="Stack Root CA"

if [ ! -f "$CERT_PATH" ]; then
    echo "Certificate file not found: $CERT_PATH"
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

# Add to keychain
sudo security add-trusted-cert -d -r trustRoot -p ssl -k "/Library/Keychains/System.keychain" "$CERT_PATH"

# Verify
if security find-certificate -c "$CERT_NAME" "/Library/Keychains/System.keychain" >/dev/null 2>&1; then
    echo "✅ Certificate successfully installed and trusted"
else
    echo "❌ Failed to install certificate"
    exit 1
fi
