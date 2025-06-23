#!/bin/sh
cd "$(dirname "$0")" || exit
rm -rf ./anubis-*.tar.gz

name="anubis-1.19.1-linux-$(dpkg --print-architecture)"

echo "Downloading $name..."
wget -qO- "https://github.com/TecharoHQ/anubis/releases/download/v1.19.1/$name.tar.gz" || exit

echo "Extracting $name..."
tar xvf "$name.tar.gz" || exit

echo "Moving $name to anubis-files..."
mv "$name" anubis-files
