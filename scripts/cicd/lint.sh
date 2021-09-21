#!/usr/bin/env bash
set -xe

npm ci
npx lerna bootstrap
git ls-tree -r HEAD --name-only | grep -E ".[tj]?sx?$|.yaml$|.json$" | grep -v assets | grep -v lerna.json | xargs -P 1 npx prettier --check
npx lerna run lint:check
