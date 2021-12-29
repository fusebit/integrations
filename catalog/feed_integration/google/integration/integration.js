// Fusebit Google Integration
//
// This simple Google integration allows you to call Google APIs on behalf of the tenants of your
// application. Fusebit manages the Google authorization process and maps tenants of your application
// to their Google credentials, so that you can focus on implementing the integration logic.
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

// The sample test endpoint of this integration gets the openid and email of the currently authenticated user.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Google client pre-configured with credentials necessary to communicate with your tenant's Google account.
  // For the Google SDK documentation, see https://jsforce.github.io/.
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const me = await googleClient.people('v1').people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses,addresses,externalIds,interests',
  });

  ctx.body = {
    message: `Successfully loaded your profile with ${Object.keys(me)} information!`,
  };
});

module.exports = integration;
