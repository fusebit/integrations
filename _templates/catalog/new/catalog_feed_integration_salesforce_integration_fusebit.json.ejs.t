---
to: catalog/feed_integration/<%= name.toLowerCase() %>/integration/fusebit.json
---
{
  "id": "<%% this.id %>",
  "tags": {
    "fusebit.service": "<%= h.capitalize(name) %>"
  },
  "handler": "./integration",
  "components": [
    {
      "name": "<%= name.toLowerCase() %>Connector",
      "skip": false,
      "provider": "@fusebit-int/<%= name.toLowerCase() %>-provider",
      "entityId": "<%% global.entities.<%= name.toLowerCase() %>Connector.id %%>",
      "dependsOn": [],
      "entityType": "connector"
    }
  ],
  "componentTags": {},
  "configuration": {}
}
