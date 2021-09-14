#!/usr/bin/env bash
set -e
echo "Running prepare publish script"
export HUSKY="0"
echo "Husky hooks disabled"
echo "Registry to publish:$PUBLISH_REGISTRY"
lerna run lint
lerna run prettier:check
lerna run build
lerna publish --registry=$PUBLISH_REGISTRY