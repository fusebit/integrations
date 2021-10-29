---
to: catalog/feed_connector/<%= name.toLowerCase() %>/connector/fusebit.json
---
{
  "id": "<%% this.id %>",
  "tags": {
    "fusebit.service": "<%= h.inflection.camelize(name, false) %>"
  },
  "handler": "@fusebit-int/<%= name.toLowerCase() %>-connector",
  "configuration": {
    "mode": {
      "useProduction": false
    },
    "scope": "<%= scope %>",
    "clientId": "<%% global.consts.random %>",
    "clientSecret": "<%% global.consts.random %>",
    "refreshErrorLimit": 100000,
    "refreshInitialBackoff": 100000,
    "refreshWaitCountLimit": 100000,
    "refreshBackoffIncrement": 100000,
    "accessTokenExpirationBuffer": 500
  }
}
