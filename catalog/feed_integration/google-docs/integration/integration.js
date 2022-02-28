// Fusebit Google Docs Integration
//
// This simple Google Docs integration allows you to call Google Docs APIs on behalf of the tenants of your
// application. Fusebit manages the Google Docs authorization process and maps tenants of your application
// to their Google Docs credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;
const connectorName = 'googleConnector';

// The sample test endpoint of this integration gets all contacts stored in the Google Docs account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Google client pre-configured with credentials necessary to communicate with your tenant's Google account.
  // For the Google SDK documentation, see https://developers.google.com/apis-explorer.
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

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
    message: `Just wrote '${fileRead.data.body.content[1].paragraph.elements[0].textRun.content}' to document named ${fileRead.data.title}`,
  };
});

module.exports = integration;
