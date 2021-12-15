---
to: catalog/feed_connector/<%= connector.toLowerCase() %>/snippets/<%= snippet.toLowerCase() %>.js
---
async function <%= connector.toLowerCase() %><%= snippet.split('-').map(t => h.capitalize(t.toLowerCase())).join('') %>(ctx) {
  // For the <%= h.capitalize(connector) %> SDK documentation, see {enter-url-here}.
  const <%= connector.toLowerCase() %>Client = await integration.tenant.getSdkByTenant(
    ctx,
    '<%% connectorName %>',
    ctx.params.tenantId || '<%% defaultTenantId %>'
  );

  // TODO: replace with a really useful thing
  // return await <%= connector.toLowerCase() %>Client.doUsefulThing();
}

const code = `
/**
 * {brief-jsdocs-function-description-of-a-snippet-for-intellisense}.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${<%= connector.toLowerCase() %><%= snippet.split('-').map(t => h.capitalize(t.toLowerCase())).join('') %>.toString()}
`;

module.exports = {
  name: '{up-to-5-words-for-gallery-listing}',
  description: '{up-to-3-sentences-for-gallery-details}',
  code,
};
