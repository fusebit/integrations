---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/env.playwright
---
OAUTH_USERNAME=
OAUTH_PASSWORD=
SECRET_CLIENTID=
SECRET_CLIENTSECRET=
INTEGRATION_ID=<%= name.toLowerCase() %>-integration
CONNECTOR_ID=<%= name.toLowerCase() %>-connector
PACKAGE_PROVIDER=
PACKAGE_CONNECTOR=
AUTHORIZATION_URL=<%= connector.authorizationUrl %>
TOKEN_URL=<%= connector.tokenUrl.toLowerCase() %>
SIGNING_SECRET=
