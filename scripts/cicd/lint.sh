#!/usr/bin/env bash
set -xe

npm i
npx lerna lint
npm run prettier:fix

# checks if anything is changed
git diff --exit-code