---
to: catalog/feed_connector/<%= name.toLowerCase() %>/catalog.json
---
{
  "id": "<%= name.toLowerCase() %>",
  "name": "<%= h.inflection.camelize(name, false) %>",
  "smallIcon": "#/assets/<%= name.toLowerCase() %>.svg",
  "largeIcon": "#/assets/<%= name.toLowerCase() %>Large.svg",
  "version": "5.2.0",
  "description": "#README.md",
  "tags": {
    "catalog": ""
  },
  "resources": {
    "configureAppDocUrl": "https://developer.fusebit.io/docs/<%= name.toLowerCase() %>#creating-your-own-<%= name.toLowerCase() %>-app"
  },
  "configuration": {
    "schema": "config/schema.json",
    "uischema": "config/uischema.json",
    "data": "config/defaults.json",
    "entities": {
      "<%= name.toLowerCase() %>Connector": {
        "entityType": "connector",
        "path": "connector/"
      }
    },
    "components": [
      {
        "name": "<%% this.id %>",
        "skip": false,
        "provider": "@fusebit-int/<%= name.toLowerCase() %>-provider",
        "entityId": "<%% this.id %>",
        "dependsOn": [],
        "entityType": "connector"
      }
    ]
  }
}
