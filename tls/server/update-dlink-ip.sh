#!/bin/sh
cd "$(dirname "$0")" || exit

printf 'subjectAltName=DNS:esdmr.iddns.ir,DNS:localhost,IP:127.0.0.1,IP:192.168.1.2,IP:%s\n' "$(../../dnslab/get-dlink-ip.sh)" >ext.cnf
