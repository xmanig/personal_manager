#!/bin/sh
set -e

CERT_DIR="${1:-./certs}"

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/cert.pem" ]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/key.pem" \
    -out "$CERT_DIR/cert.pem" \
    -subj "/CN=localhost" 2>/dev/null
  echo "Self-signed cert generated in $CERT_DIR/"
else
  echo "Cert already exists in $CERT_DIR/"
fi
