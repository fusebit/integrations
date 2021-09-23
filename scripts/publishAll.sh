#!/usr/bin/env bash

fuse profile set $1

fuse npm login

FUSE_PROFILE=$(fuse profile get -o json ${i})
URL=$(echo $FUSE_PROFILE | jq -r .baseUrl)/v1/account/$(echo $FUSE_PROFILE | jq -r .account)/registry/default/npm
lerna publish from-package --registry $URL --yes
