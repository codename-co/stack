#!/bin/bash
set -e

CWD=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CERT_PATH="$CWD/../certs/root.cer"

if [ ! -f "$CERT_PATH" ]; then
    echo "Certificate file not found: $CERT_PATH"
    exit 1
fi

PASSWORD="xcvxcvxcv"

cd "$CWD/../certs"

# Generate root certificate
openssl req -x509 -new -keyout root.key -out root.cer -config root.cnf -days 825 -passout "pass:$PASSWORD"

# Generate server certificate
openssl req -nodes -new -keyout server.key -out server.csr -config server.cnf
openssl x509 -days 825 -req -in server.csr -CA root.cer -CAkey root.key -set_serial 123 -out server.cer -extfile server.cnf -extensions x509_ext -passin "pass:$PASSWORD"
