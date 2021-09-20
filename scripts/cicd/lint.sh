#!/usr/bin/env bash
set -xe

npm ci
npx lerna bootstrap
npm run lint:fix
npm run prettier:fix

# checks if anything is changed
git diff --exit-code
