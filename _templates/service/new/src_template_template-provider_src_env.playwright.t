---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/env.playwright
---
OAUTH_USERNAME=
OAUTH_PASSWORD=
SECRET_CLIENTID=
SECRET_CLIENTSECRET=
INTEGRATION_ID=test-play-<%= name.toLowerCase() %>-int
CONNECTOR_ID=test-play-<%= name.toLowerCase() %>-con
PACKAGE_PROVIDER=
PACKAGE_CONNECTOR=
AUTHORIZATION_URL=<%= connector.authorizationUrl %>
TOKEN_URL=<%= connector.tokenUrl.toLowerCase() %>
SIGNING_SECRET=
OAUTH_AUDIENCE=
