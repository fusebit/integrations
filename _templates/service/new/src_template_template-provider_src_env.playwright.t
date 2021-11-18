---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/env.playwright
---
OAUTH_USERNAME=
OAUTH_PASSWORD=
SECRET_CLIENTID=
SECRET_CLIENTSECRET=
INTEGRATION_ID=<%= name.toLowerCase() %>-play-int
CONNECTOR_ID=<%= name.toLowerCase() %>-play-con
PACKAGE_PROVIDER=
PACKAGE_CONNECTOR=
AUTHORIZATION_URL=<%= connector.authorizationUrl %>
TOKEN_URL=<%= connector.tokenUrl.toLowerCase() %>
SIGNING_SECRET=
OAUTH_AUDIENCE=
