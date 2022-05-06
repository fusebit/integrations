---
to: catalog/feed_connector/<%= name.toLowerCase() %>/config/schema.json
---
{
  "type": "object",
  "properties": {
    "<%= name.toLowerCase() %>Connector": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "minLength": 3
        }
      }
    }
  }
}
