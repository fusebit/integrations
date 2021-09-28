#!/usr/bin/env bash

# -- Standard Header --
echoerr() { printf "%s\n" "$*" >&2; }
export FUSEBIT_DEBUG=

# -- Optional Parameters --
mkdir -p ~/.aws
echo ${AWS_PROFILE_RAW} > ~/.aws/credentials
AWS_PROFILE=${AWS_PROFILE:=default}

# -- Script --
set -e

cd catalog

node libc/index.js feed_integration > integrationsFeed.json
node libc/index.js feed_connector > connectorsFeed.json

aws --profile=${AWS_PROFILE} s3 cp --acl public-read --cache-control max-age=0 \
  integrationsFeed.json \
  s3://${S3_BUCKET}/feed/integrationsFeed.json

aws --profile=${AWS_PROFILE} s3 cp --acl public-read --cache-control max-age=0 \
  connectorsFeed.json \
  s3://${S3_BUCKET}/feed/connectorsFeed.json

aws cloudfront create-invalidation --profile=${AWS_PROFILE} --distribution-id ${CLOUDFRONT_ID} --paths '/*'
