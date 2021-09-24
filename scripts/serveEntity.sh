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

# Include the node_modules for the entity in the search path, to aid resolution in framework of various
# connectors and providers that are side-loaded via string-based require() statements.
export NODE_PATH=${NODE_PATH}:${TARGETDIR}/node_modules

# Serve the function
fuse function serve -b ${ENTITYTYPE} ${ENTITYID} -d ${TARGETDIR}
