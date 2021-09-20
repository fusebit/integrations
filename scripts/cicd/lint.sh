#!/usr/bin/env bash
set -xe

npm i
npx lerna run lint
npm run prettier:fix

# checks if anything is changed
git diff --exit-code