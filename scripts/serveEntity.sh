#!/bin/bash

set -e

ENTITYTYPE=$1
ENTITYID=$2

PREFIX=workspace

usage() {
  echo "Usage: $0 [integration,connector] entityId"
  exit -1
}

if [[ "${ENTITYTYPE}" == "" || "${ENTITYID}" == "" ]]; then
  usage
fi


if [[ "${ENTITYTYPE}" != "integration" && "${ENTITYTYPE}" != "connector" ]]; then
  usage
fi

TARGETDIR=${PREFIX}/${ENTITYTYPE}-${ENTITYID}

# Get the function into the TARGETDIR
mkdir -p ${TARGETDIR}
rm -rf ${TARGETDIR}
fuse function get -b ${ENTITYTYPE} ${ENTITYID} -d ${TARGETDIR}

# Add a 'name' to the package.json to avoid accidental 'unnamed' project confusion by lerna
NEWPACKAGE=`cat ${TARGETDIR}/package.json | jq ".name = \"${ENTITYID}\""`
echo ${NEWPACKAGE} > ${TARGETDIR}/package.json

# Use lerna to create the symlinks for the function's node_modules directory
lerna bootstrap

if [[ ! -L "${TARGETDIR}/node_modules/@fusebit-int/framework" ]]; then
  RED='\033[0;31m'
  NC='\033[0m'
  echo
  printf "${RED}WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING${NC}\n"
  echo
  echo Symlinks were not properly created for 'framework'. This is likely caused
  echo by the versions in package.json being hardcoded.
  echo
  echo 1. Leave this command running.
  echo 2. Change the package.json versions to be '*' or something equally inclusive.
  echo 3. Remove all of the internal packages: \'rm -rf ${TARGETDIR}/node_modules/@fusebit-int\'
  echo 3. Run 'lerna bootstrap' again.
  echo 4. Run \'ls -la ${TARGETDIR}/node_modules/@fusebit-int\' and validate that the packages
  echo "   are symlinked."
  echo
  printf "${RED}WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING${NC}\n"
fi

# Include the node_modules for the entity in the search path, to aid resolution in framework of various
# connectors and providers that are side-loaded via string-based require() statements.
export NODE_PATH=${NODE_PATH}:${TARGETDIR}/node_modules

# Serve the function
fuse function serve -b ${ENTITYTYPE} ${ENTITYID} -d ${TARGETDIR}
