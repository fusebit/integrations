#!/usr/bin/env bash

set -e

FUSEPROFILE=$1

if [[ "${FUSEPROFILE}" != "" ]]; then
  fuse profile set ${FUSEPROFILE}
else
  FUSEPROFILE=`fuse profile get -o json | jq -r ".id"`
  echo Using current profile: ${FUSEPROFILE}
fi

fuse npm login

FUSE_PROFILE=$(fuse profile get -o json ${i})
URL=$(echo $FUSE_PROFILE | jq -r .baseUrl)/v1/account/$(echo $FUSE_PROFILE | jq -r .account)/registry/default/npm
lerna publish from-package --registry $URL --yes --force-publish=@fusebit-int/sample-app

