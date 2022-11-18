---
inject: true
to: "<%= `src/${name.toLowerCase()}/${name.toLowerCase()}-connector/src/index.ts` %>"
after: '// Configure'
---

<% if (connector.tokenUrl) { -%>
    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        '<%= h.capitalize(name) %> Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
    });
<% } -%>