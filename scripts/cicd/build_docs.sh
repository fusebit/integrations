#!/usr/bin/env bash

set -xe

cd tool/publish-docs

npm ci
npm run build
