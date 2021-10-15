---
to: catalog/feed_integration/<%= name.toLowerCase() %>/config/schema.json
---
{
  "type": "object",
  "properties": {
    "<%= name.toLowerCase() %>Integration": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "minLength": 3
        }
      }
    },
    "<%= name.toLowerCase() %>Connector": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "minLength": 3
        }
      }
    },
    "ui": {
      "type": "object",
      "properties": {
        "toggle": {
          "type": "boolean",
          "description": "The \"toggle\" option renders boolean values as a toggle."
        }
      }
    }
  }
}
