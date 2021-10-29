---
to: catalog/feed_connector/<%= name.toLowerCase() %>/connector/package.json
---
{
  "name": "@fusebit-int/catalog-feed-connector-<%= name.toLowerCase() %>-connector",
  "version": "<%= h.currentVersion %>",
  "private": true,
  "scripts": {
    "redeploy": "fuse connector rm <%%this.name%> && yarn deploy",
    "deploy": "fuse connector deploy <%%this.name%> -d .",
    "get": "fuse connector get <%%this.name%> -d ."
  },
  "dependencies": {
    "@fusebit-int/framework": ">=<%= h.currentVersion %>",
    "@fusebit-int/<%= name.toLowerCase() %>-connector": ">=<%= h.currentVersion %>"
  }
}
