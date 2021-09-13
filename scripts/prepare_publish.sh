#!/usr/bin/env bash
set -e
echo "Running prepare publish script"
export HUSKY="0"
echo "HUSKY hooks disabled"
lerna run lint
lerna run prettier:check
lerna run build
lerna publish --registry=$PUBLISH_REGISTRY
