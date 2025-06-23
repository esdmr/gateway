#!/bin/sh
cd "$(dirname "$0")" || exit

ip="$(dnslab/get-dlink-ip.sh)"

printf 'subjectAltName=DNS:esdmr.iddns.ir,DNS:localhost,IP:127.0.0.1,IP:192.168.1.2,IP:%s' "$ip" >tls/server/ext.cnf

printf 'server_name esdmr.iddns.ir localhost 127.0.0.1 192.168.1.2 %s "";\n' "$ip" >nginx/name.inc
