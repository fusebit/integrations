#!/usr/bin/env bash

# Set standard bash debug envs
set -x

# Install fusebit tools

npm i -g @fusebit/cli

# start publish

for i in $FUSE_PROFILE_INTERNAL_LIST
do
  ./scripts/cicd/set_fuse_profile.sh $i
  fuse npm login -p $i
  FUSE_PROFILE=$(fuse profile get -o json ${i})
  URL=$(echo $FUSE_PROFILE | jq -r .baseUrl)/v1/account/$(echo $FUSE_PROFILE | jq -r .account)/registry/default/npm
  lerna publish from-package --registry $URL --yes
done
