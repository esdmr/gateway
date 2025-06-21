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
echo "Generate web server's private key and certificate signing request (CSR)"
openssl req \
	-newkey rsa:4096 \
	-passout file:key.txt \
	-subj "/C=IR/ST=AA/L=AA/O=AA/CN=*" \
	-out req.pem \
	-keyout key.pem || exit

echo
echo "Use CA's private key to sign web server's CSR and get back the signed certificate"
openssl x509 \
	-req \
	-CAcreateserial \
	-CA ../ca/cert.pem \
	-CAkey ../ca/key.pem \
	-passin file:../ca/key.txt \
	-in req.pem \
	-extfile ext.cnf \
	-days 7 \
	-out cert.pem || exit

echo
echo "Server's signed certificate"
openssl x509 \
	-in cert.pem \
	-noout \
	-text || exit
