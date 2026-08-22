#!/bin/bash
#
# Mints the TLS material this stack serves, into ./certs.
#
# Nothing is committed to the repository: a private key in a public repo is a
# private key everybody has, and anyone holding the CA key of a machine you
# trusted can impersonate any site to it. Run this once per machine.
#
# Produces:
#   certs/root.pem   local anchor — this is what you trust (see trust-cert.sh)
#   certs/chain.pem  the leaf traefik serves
#   certs/key.pem    its private key
#
# The Stack app does not need any of this: it generates an equivalent, name
# constrained authority per install and points STACK_CERTS_DIR at it.
set -euo pipefail

CWD=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CERT_DIR="$CWD/../certs"
DOMAIN="${DOMAIN:-stack.localhost}"

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

conf=$(mktemp)
trap 'rm -f "$conf"' EXIT

# The anchor. `nameConstraints` is what keeps this key from being worth
# stealing: even with it, an attacker can only speak for $DOMAIN and its
# subdomains — hosts that already resolve to this machine's loopback.
cat >"$conf" <<EOF
[ req ]
prompt             = no
distinguished_name = dn
x509_extensions    = ext

[ dn ]
O  = codename
OU = Stack local certificate authority
CN = Stack Local CA

[ ext ]
basicConstraints = critical,CA:true,pathlen:0
keyUsage         = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
nameConstraints  = critical,permitted;DNS:$DOMAIN,excluded;IP:0.0.0.0/0.0.0.0,excluded;IP:::/::
EOF

openssl req -x509 -nodes -newkey rsa:2048 -sha256 -days 3650 \
    -keyout root-key.pem -out root.pem -config "$conf"

# The leaf. A wildcard matches a single label, so the bare domain — the
# dashboard — needs its own SAN entry.
cat >"$conf" <<EOF
[ req ]
prompt             = no
distinguished_name = dn

[ dn ]
O  = codename
OU = Stack local proxy
CN = *.$DOMAIN

[ ext ]
basicConstraints     = critical,CA:false
keyUsage             = critical,digitalSignature,keyEncipherment
extendedKeyUsage     = serverAuth
subjectKeyIdentifier = hash
subjectAltName       = DNS:$DOMAIN,DNS:*.$DOMAIN
EOF

openssl req -nodes -newkey rsa:2048 -sha256 -keyout key.pem -out leaf.csr -config "$conf"
openssl x509 -req -in leaf.csr -CA root.pem -CAkey root-key.pem -CAcreateserial \
    -days 825 -sha256 -out chain.pem -extfile "$conf" -extensions ext
rm -f leaf.csr root.srl

chmod 600 key.pem root-key.pem
chmod 644 chain.pem root.pem

echo "✅ Certificates written to $CERT_DIR"
echo "   Next: ./scripts/trust-cert.sh"
