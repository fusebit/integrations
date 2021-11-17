---
to: catalog/feed_integration/<%= name.toLowerCase() %>/connector/package.json
---
{
  "name": "@fusebit-int/catalog-feed-integration-<%= name.toLowerCase() %>-connector",
  "version": "<%= h.currentVersion %>",
  "private": true,
  "scripts": {
    "redeploy": "fuse connector rm <%% this.id %> && yarn deploy",
    "deploy": "fuse connector deploy <%% this.id %> -d .",
    "get": "fuse connector get <%% this.id %> -d ."
  },
  "dependencies": {
    "@fusebit-int/framework": ">=<%= h.currentVersion %>",
    "@fusebit-int/<%= name.toLowerCase() %>-connector": ">=<%= h.currentVersion %>"
  }
}
