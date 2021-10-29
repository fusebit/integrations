---
to: catalog/feed_integration/<%= name.toLowerCase() %>/integration/package.json
---
{
  "name": "@fusebit-int/catalog-feed-integration-<%= name.toLowerCase() %>-integration",
  "version": "<%= h.currentVersion %>",
  "private": true,
  "scripts": {
    "deploy": "fuse integration deploy <%% this.id %> -d .",
    "get": "fuse integration get <%% this.id %> -d ."
  },
  "dependencies": {
    "@fusebit-int/framework": ">=<%= h.currentVersion %>",
    "@fusebit-int/<%= name.toLowerCase() %>-provider": ">=<%= h.currentVersion %>"
  },
  "files": [
    "./integration.js",
    "README.md"
  ]
}
