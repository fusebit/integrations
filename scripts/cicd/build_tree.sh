#!/usr/bin/env bash

set -xe

npm ci
npx lerna bootstrap
npx lerna run build


cd tool/publish-docs

npm ci
npm run build