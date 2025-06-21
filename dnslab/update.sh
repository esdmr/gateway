#!/bin/sh
cd "$(dirname "$0")" || exit
echo url="https://api.dnslab.link/DDNS/U?k=$(cat key.txt)" | curl -k -o last.log -K -
