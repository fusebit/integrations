#!/usr/bin/env bash

set -ex

yarn build
mkdir -p demo
node libc/index.js feed_integration > demo/integrationsFeed.json
{ echo -ne "HTTP/1.0 200 OK\r\nContent-Type: application/json\r\n\r\n"; cat demo/integrationsFeed.json; } | nc -l 8000 &
FEED_BASE_URL=http://localhost:8000/ fuse integration init -f $1 -d demo/$1
