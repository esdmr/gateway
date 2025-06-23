default:
	echo No default command. && exit 1

chmod:
# Do not skip the sh here, since chmod itself might not be executable yet.
	sh ./chmod.sh

dlink dlink.update-name:
	./dlink.update-name.sh

anubis/download: anubis/anubis-files

anubis/anubis-files:
	./anubis/download.sh

anubis anubis/build: anubis/anubis-files
	docker build anubis

dnslab dnslab/update:
	./dnslab/update.sh

tls/ca: tls/ca/cert.pem tls/ca/key.pem tls/ca/key.txt

tls/ca/cert.pem tls/ca/key.pem tls/ca/key.txt:
	./tls/ca/generate.sh

tls/ca/regenerate:
	./tls/ca/generate.sh

tls/server: tls/server/cert.pem tls/server/key.pem tls/server/key.txt

tls/server/cert.pem tls/server/key.pem tls/server/key.txt tls/server/req.pem: tls/ca/cert.pem tls/ca/key.pem tls/ca/key.txt tls/server/ext.cnf
	./tls/server/generate.sh

tls/server/regenerate:
	./tls/server/generate.sh

tls: tls/ca tls/server

.PHONY: default chmod dlink dlink.update-name anubis/download anubis/build anubis dnslab/update dnslab tls/ca tls/ca/regenerate tls/server tls/server/regenerate tls
