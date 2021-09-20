#!/usr/bin/env bash
set -xe

npm ci
npx lerna bootstrap
./scripts/cicd/remote_ref_prettier.sh

# checks if anything is changed
git diff --exit-code