#!/bin/bash

set -e 

BASE=${PWD}
PKGS="src/framework src/*/*-connector src/*/*-provider"

publish()
{
  echo > ~/.npmrc
  fuse npm login > /dev/null

  for pkgName in ${PKGS}; do
    pkgPath=${BASE}/${pkgName}

    if [ -e ${pkgPath}/package.json ]; then
      cd ${pkgPath};
      echo PUBLISHING ${pkgPath}
      npm publish > /dev/null 2>/dev/null
      cd ${BASE}
    fi
  done
}

publish
