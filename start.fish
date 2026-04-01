#!/usr/bin/env fish
if not contains -- no-ddns $argv
    pushd dnslab
    ./update.sh || echo Setting dnslab failed.
    popd
end
./dlink.update-name.sh || echo Updating name failed.
pushd tls/server
./generate.sh || echo Generating TLS cert failed.
popd
docker compose up --no-start || echo Bringing up gateway failed.
pushd ../gitea
docker compose up -d || echo Bringing up gitea failed.
popd
docker compose up -d || echo Starting gateway failed.
exec node --enable-source-maps notifications.mts
