#!/usr/bin/env bash

set -xe

npx lerna bootstrap
npx lerna run build

cd tool/publish-docs

npm i
npm run build
