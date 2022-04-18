const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'googleConnector';

// Test Endpoint: Create a new Google Doc and add content to it
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developers.google.com/docs/api/reference/rest/
  const file = await googleClient.docs('v1').documents.create({
    title: 'Fusebit Hello World',
  });

  await googleClient.docs('v1').documents.batchUpdate({
    documentId: file.data.documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: 'Hello world from Fusebit',
          },
        },
      ],
    },
  });
  const fileRead = await googleClient.docs('v1').documents.get({
    documentId: file.data.documentId,
  });
  ctx.body = {
    message: `Success! Just wrote '${fileRead.data.body.content[1].paragraph.elements[0].textRun.content}' to document named ${fileRead.data.title}`,
  };
});

module.exports = integration;
