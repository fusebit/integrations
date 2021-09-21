#!/usr/bin/env bash

# Set standard bash debug envs
set -x

# install fusebit tools

npm i -g @fusebit/cli

# start publish

for i in $FUSE_PROFILE_INTERNAL_LIST
do
    echo $i
    echo ${!i} | fuse profile import $i
    fuse profile get -o json -p $i
done