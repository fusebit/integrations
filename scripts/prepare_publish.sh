#!/usr/bin/env bash
set -e
echo "Running prepare publish script"
lerna run lint
lerna run prettier:check
lerna run build
lerna publish --registry=$PUBLISH_REGISTRY
