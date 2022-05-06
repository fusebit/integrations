---
to: catalog/feed_connector/<%= name.toLowerCase() %>/config/uischema.json
---
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/<%= name.toLowerCase() %>Connector/properties/id",
      "label": "Name"
    }
  ]
}
