#!/usr/bin/env bash
set -e
echo "Running prepare publish script"
export HUSKY="0"
echo "Husky hooks disabled"
lerna run lint
lerna run prettier:check
lerna run build
lerna version $1 --no-git-tag-version