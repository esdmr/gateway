#!/bin/sh
cd "$(dirname "$0")" || exit

printf 'subjectAltName=DNS:esdmr.iddns.ir,IP:%s\n' "$(../../dnslab/get-dlink-ip.sh)" >ext.cnf
