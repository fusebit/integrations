#!/usr/bin/env bash

git ls-tree -r $GITHUB_BASE_REF --name-only | grep -E \"\\.[tj]?sx?$|\\.yaml$|\\.json$\" | grep -v assets | grep -v lerna.json | xargs -P 1 prettier --check