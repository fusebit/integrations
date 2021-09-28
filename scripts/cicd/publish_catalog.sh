#!/usr/bin/env bash

# -- Standard Header --
echoerr() { printf "%s\n" "$*" >&2; }
export FUSEBIT_DEBUG=

# -- Script --
set -ex

cd catalog

node libc/index.js feed_integration > integrationsFeed.json
node libc/index.js feed_connector > connectorsFeed.json

aws s3 cp --acl public-read --cache-control max-age=0 \
  integrationsFeed.json \
  s3://${S3_BUCKET}/feed/integrationsFeed.json

aws s3 cp --acl public-read --cache-control max-age=0 \
  connectorsFeed.json \
  s3://${S3_BUCKET}/feed/connectorsFeed.json

aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths '/*'
