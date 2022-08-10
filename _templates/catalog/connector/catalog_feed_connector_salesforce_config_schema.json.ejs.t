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
          "minLength": 3,
          "pattern": "'/^[A-Za-z0-9-]{1,64}$/'",
          "errorMessage": {
            "minLength": "Connector name must be at least 3 characters long",
            "pattern": "Connector name cannot have any spaces or special characters"
          }
        }
      }
    }
  }
}
