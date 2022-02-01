---
to: catalog/feed_integration/<%= name.toLowerCase() %>/catalog.json
---
{
  "id": "<%= name.toLowerCase() %>-ph",
  "name": "<%= h.capitalize(name) %>",
  "smallIcon": "#/assets/<%= name.toLowerCase() %>.svg",
  "largeIcon": "#/assets/<%= name.toLowerCase() %>Large.svg",
  "version": "5.2.0",
  "description": "#README.md",
  "outOfPlan": true,
  "tags": {
    "catalog": "<%= feedTags %>"
  },
  "resources": {
    "configureAppDocUrl": "https://developer.fusebit.io/docs/<%= name.toLowerCase() %>#creating-your-own-<%= name.toLowerCase() %>-app"
  },
  "configuration": {}
}
