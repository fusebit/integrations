---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/env.playwright
---
OAUTH_USERNAME=
OAUTH_PASSWORD=
SECRET_CLIENTID=
SECRET_CLIENTSECRET=
INTEGRATION_ID=<%= play.integration.toLowerCase() %>
CONNECTOR_ID=<%= play.connector.toLowerCase() %>
PACKAGE_PROVIDER=
PACKAGE_CONNECTOR=
AUTHORIZATION_URL=<%= connector.authorizationUrl.toLowerCase() %>
TOKEN_URL=<%= connector.tokenUrl.toLowerCase() %>
SIGNING_SECRET=
