// Fusebit LinkedIn Integration
//
// This simple LinkedIn integration allows you to call LinkedIn APIs on behalf of the tenants of your
// application. Fusebit manages the LinkedIn authorization process and maps tenants of your application
// to their LinkedIn credentials, so that you can focus on implementing the integration logic.
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
const connectorName = 'linkedinConnector';

// The sample test endpoint of this integration gets lite profile user information from a LinkedIn account associated with your tenant.
// Read more at https://docs.microsoft.com/en-us/linkedin/shared/references/v2/profile/lite-profile
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a LinkedIn client pre-configured with credentials necessary to communicate with your tenant's LinkedIn account.
  // For the LinkedIn SDK documentation, see https://developer.linkedin.com/.
  const linkedInClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const { id, localizedLastName, localizedFirstName } = await linkedInClient.get('me');

  ctx.body = {
    message: `The user with id ${id} is ${localizedFirstName} ${localizedLastName} on LinkedIn`,
  };
});

module.exports = integration;
