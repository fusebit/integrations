#!/usr/bin/env bash
set -xe

npm ci
npx lerna bootstrap
npm run lint:check
npm run prettier:check

# checks if anything is changed
git diff --exit-code
