#!/bin/sh
cd "$(dirname "$0")" || exit
expect -c "
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
" | grep -o -P '(?<=inet addr:)(?!192|127)\d+\.\d+\.\d+\.\d+'
