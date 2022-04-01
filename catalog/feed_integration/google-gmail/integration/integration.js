// Fusebit Google Gmail Integration
//
// This simple Google Gmail integration allows you to call Google Gmail APIs on behalf of the tenants of your
// application. Fusebit manages the Google Gmail authorization process and maps tenants of your application
// to their Google Gmail credentials, so that you can focus on implementing the integration logic.
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
const connectorName = 'gmailConnector';

// The sample test endpoint of this integration gets all contacts stored in the Google Gmail account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const gmail = googleClient.gmail({ version: 'v1' });
  const emails = await gmail.users.messages.list({ userId: 'me' });

  ctx.body = { message: `You have ${emails.data.messages.length} messages` };
});

module.exports = integration;
