#!/usr/bin/env bash

# Set standard bash debug envs
set -x

# install fusebit tools

npm i -g @fusebit/cli

# check if publish is nessersary
VER_WART=v
VERSION=$(cat lerna.json | jq -r .version)
git tag --points-at HEAD | grep ${VER_WART}${VERSION} > /dev/null
TAG_TEST=$?
if [ ${TAG_TEST} -ne 0 ]; then
  echo "Not publishing ${VERSION} - HEAD is not tagged ${VER_WART}-${VERSION}"
  git tag --points-at HEAD
  exit 0;
else
  echo "Publishing ${VERSION}"
fi

# start publish

for i in $FUSE_PROFILE_INTERNAL_LIST
do
    echo $i
    eval echo \$$i | fuse profile import $i
    fuse profile get -o json $i
    fuse npm login -p $i
    FUSE_PROFILE=$(fuse profile get -o json)
    URL=$(echo $FUSE_PROFILE | jq -r .baseUrl)/v1/account/$(echo $FUSE_PROFILE | jq -r .account)/registry/default/npm
    lerna publish from-git $URL
done