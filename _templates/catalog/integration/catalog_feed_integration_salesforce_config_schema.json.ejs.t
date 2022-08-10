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
          "minLength": 3,
          "pattern": "'/^[A-Za-z0-9-]{1,64}$/'",
          "errorMessage": {
            "minLength": "Integration name must be at least 3 characters long",
            "pattern": "Integration name cannot have any spaces or special characters"
          }
        }
      }
    },
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
