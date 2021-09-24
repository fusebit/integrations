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

mkdir -p ${TARGETDIR}

rm -rf ${TARGETDIR}
fuse function get -b ${ENTITYTYPE} ${ENTITYID} -d ${TARGETDIR}
lerna bootstrap
fuse function serve -b ${ENTITYTYPE} ${ENTITYID} -d ${TARGETDIR}
