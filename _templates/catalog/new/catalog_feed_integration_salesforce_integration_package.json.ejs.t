---
to: catalog/feed_integration/<%= name.toLowerCase() %>/integration/package.json
---
{
  "name": "@fusebit-int/catalog-feed-integration-<%= name.toLowerCase() %>-integration",
  "version": "6.3.1",
  "private": true,
  "scripts": {
    "deploy": "fuse integration deploy <%% this.id %> -d .",
    "get": "fuse integration get <%% this.id %> -d ."
  },
  "dependencies": {
    "@fusebit-int/framework": ">0.0.0",
    "@fusebit-int/<%= name.toLowerCase() %>-provider": ">0.0.0"
  },
  "files": [
    "./integration.js",
    "README.md"
  ]
}
