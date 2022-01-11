---
to: catalog/feed_integration/<%= name.toLowerCase() %>/catalog.json
---
{
  "id": "<%= name.toLowerCase() %>",
  "name": "<%= h.capitalize(name) %>",
  "smallIcon": "#/assets/<%= name.toLowerCase() %>.svg",
  "largeIcon": "#/assets/<%= name.toLowerCase() %>Large.svg",
  "version": "5.2.0",
  "description": "#README.md",
  "tags": {
    "catalog": "<%- feedTags %>"
  },
  "resources": {
    "configureAppDocUrl": "https://developer.fusebit.io/docs/<%= name.toLowerCase() %>#creating-your-own-<%= name.toLowerCase() %>-app",
    "sampleConfig": {
      "isEnabled": <%= isSampleApp %>
      <% if (locals.isSampleApp) { -%>
        ,
        "isGetEnabled": <%= isGetEnabled %>,
        "isPostEnabled": <%= isPostEnabled %>,
        "terms": {
          <% if (locals.isPostEnabled) { -%>
            "postSuccess": "<%= postSuccess %>",
            "postFail": "<%= postFail %>",
          <% } -%>
          <% if (locals.isGetEnabled) { -%>
            "getFail": "<%= getFail %>",
          <% } -%>
          "itemName": "<%= itemName %>",
          "properties": [
            {
              "name": "<%= property1[0] %>",
              "label": "<%= property1[1] %>"
            },
            {
              "name": "<%= property2[0] %>",
              "label": "<%= property2[1] %>"
            }
          ]
        }
      <% } -%>
    }
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
