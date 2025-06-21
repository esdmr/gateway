#!/bin/sh
cd "$(dirname "$0")" || exit
rm ./*.pem

echo "Generate web service's password"
openssl rand \
	-hex \
	-out key.txt \
	32 || exit

chmod 600 key.txt || exit

echo
echo "Generate CA's private key and self-signed certificate"
openssl req \
	-x509 \
	-newkey rsa:4096 \
	-days 365 \
	-subj "/C=IR/ST=AA/L=AA/O=AA/CN=*" \
	-passout file:key.txt \
	-out cert.pem \
	-keyout key.pem

echo
echo "CA's self-signed certificate"
openssl x509 \
	-in cert.pem \
	-noout \
	-text
