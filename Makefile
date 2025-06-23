default:
	echo No default command. && exit 1

chmod:
# Do not skip the sh here, since chmod itself might not be executable yet.
	sh ./chmod.sh

.PHONY: default chmod

pull:
	docker compose pull

build:
	docker compose build

up:
	docker compose up -d

start:
	docker compose start

logs:
	docker compose logs

restart:
	docker compose restart

ps:
	docker compose ps

stop:
	docker compose stop

kill:
	docker compose kill

down:
	docker compose down

.PHONY: pull build up start logs restart ps stop kill down

dlink dlink.update-name:
	./dlink.update-name.sh

.PHONY: dlink dlink.update-name

anubis/anubis-files:
	./anubis/download.sh

anubis anubis/build: anubis/anubis-files
	docker build anubis

.PHONY: anubis anubis/build

dnslab dnslab/update:
	./dnslab/update.sh

.PHONY: dnslab dnslab/update

tls/ca/cert.pem tls/ca/key.pem tls/ca/key.txt:
	./tls/ca/generate.sh

tls/ca/regenerate:
	./tls/ca/generate.sh

tls/ca: tls/ca/cert.pem tls/ca/key.pem tls/ca/key.txt

.PHONY: tls/ca tls/ca/regenerate

tls/server: tls/server/cert.pem tls/server/key.pem tls/server/key.txt

tls/server/cert.pem tls/server/key.pem tls/server/key.txt tls/server/req.pem: tls/ca/cert.pem tls/ca/key.pem tls/ca/key.txt tls/server/ext.cnf
	./tls/server/generate.sh

tls/server/regenerate:
	./tls/server/generate.sh

tls/server: tls/server/cert.pem tls/server/key.pem tls/server/key.txt

.PHONY: tls/server tls/server/regenerate

tls: tls/ca tls/server

.PHONY: tls
