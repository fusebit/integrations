#!/usr/bin/env bash

set -xe

npm ci
npx lerna bootstrap
npx lerna run build
