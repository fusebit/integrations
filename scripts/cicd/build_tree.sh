#!/usr/bin/env bash

set -xe

npm i
npx lerna bootstrap
npx lerna run build