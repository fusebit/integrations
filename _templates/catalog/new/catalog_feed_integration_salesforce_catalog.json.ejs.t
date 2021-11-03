---
to: catalog/feed_integration/<%= name.toLowerCase() %>/catalog.json
---
{
  "id": "<%= name.toLowerCase() %>",
  "name": "<%= h.capitalize(name) %>",
  "smallIcon": "#/assets/<%= name.toLowerCase() %>.svg",
  "largeIcon": "#/assets/<%= name.toLowerCase() %>.svg",
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
      },
      "<%= name.toLowerCase() %>Integration": {
        "entityType": "integration",
        "path": "integration/"
      }
    }
  }
}
