#!/bin/sh

find . -type d -execdir chmod -c 775 {} +
find . \( -type f -a ! -name '*.sh' -a ! -name 'key.*' -a ! -name '*.key.*' -a ! -path '*/.git/*' \) -execdir chmod -c 664 {} +

find . -name '*.sh' -execdir chmod -c 774 {} +

find . \( -name 'key.*' -o  -name '*.key.*' \) -execdir chmod -c 600 {} +
