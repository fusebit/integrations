#!/usr/bin/env bash

set -xe

npm install
npx lerna bootstrap
npx lerna run build