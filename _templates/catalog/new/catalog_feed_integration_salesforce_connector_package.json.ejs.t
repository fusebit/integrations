---
to: catalog/feed_integration/<%= name.toLowerCase() %>/connector/package.json
---
{
  "name": "@fusebit-int/catalog-feed-integration-<%= name.toLowerCase() %>-connector",
  "version": "6.3.1",
  "private": true,
  "scripts": {
    "redeploy": "fuse connector rm <%%this.name%> && yarn deploy",
    "deploy": "fuse connector deploy <%%this.name%> -d .",
    "get": "fuse connector get <%%this.name%> -d ."
  },
  "dependencies": {
    "@fusebit-int/framework": "^6.3.1",
    "@fusebit-int/<%= name.toLowerCase() %>-connector": "^6.3.1"
  }
}