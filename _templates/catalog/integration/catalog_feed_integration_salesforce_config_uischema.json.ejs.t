---
to: catalog/feed_integration/<%= name.toLowerCase() %>/config/uischema.json
---
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/<%= name.toLowerCase() %>Integration/properties/id",
      "label": "Name"
    },
    {
      "type": "Control",
      "label": "Customize",
      "scope": "#/properties/ui/properties/toggle",
      "options": {
        "toggle": true
      }
    },
    {
      "type": "Control",
      "scope": "#/properties/<%= name.toLowerCase() %>Connector/properties/id",
      "label": "<%= h.capitalize(name) %> Connector name",
      "rule": {
        "effect": "SHOW",
        "condition": {
          "scope": "#/properties/ui/properties/toggle",
          "schema": { "const": true }
        }
      }
    }
  ]
}
