#!/bin/sh
cd "$(dirname "$0")" || exit

ip="$(expect -c "
	spawn telnet 192.168.1.1
	expect \"Login\"
	send \"admin\r\"
	expect \"Password\"
	send \"$(cat dlink.key.txt)\\r\"
	expect \">\"
	send \"ifconfig\\r\"
	expect \">\"
	send \"exit\\r\"
	interact
" | grep -o -P '(?<=inet addr:)(?!192|127)\d+\.\d+\.\d+\.\d+')"

domain=esdmr.iddns.ir

echo $domain : $ip

printf 'subjectAltName=DNS:%s,DNS:localhost,IP:127.0.0.1,IP:192.168.1.2,IP:%s' "$domain" "$ip" >tls/server/ext.cnf

printf 'server_name %s localhost 127.0.0.1 192.168.1.2 %s "";\n' "$domain" "$ip" >nginx/name.inc
