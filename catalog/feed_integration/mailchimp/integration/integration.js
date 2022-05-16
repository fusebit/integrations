// Fusebit Mailchimp Integration
//
// This simple Mailchimp integration allows you to call Mailchimp APIs on behalf of the tenants of your
// application. Fusebit manages the Mailchimp authorization process and maps tenants of your application
// to their Mailchimp credentials, so that you can focus on implementing the integration logic.
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
const connectorName = 'mailchimpConnector';

// The sample test endpoint of this integration gets all contacts stored in the Mailchimp account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Mailchimp client pre-configured with credentials necessary to communicate with your tenant's Mailchimp account.
  // For the Mailchimp Marketing documentation, see https://mailchimp.com/developer/marketing/.
  const mailchimpClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const { lists } = await mailchimpClient.marketing.lists.getAllLists();

  ctx.body = lists
    .map((audience) => {
      const {
        name,
        stats: { member_count, unsubscribe_count, open_rate },
      } = audience;
      return `The audience ${name} has ${member_count} active members with ${unsubscribe_count} unsubscribed members with an open rate of ${open_rate}`;
    })
    .join('/n');
});

router.get('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Mailchimp client pre-configured with credentials necessary to communicate with your tenant's Mailchimp account.
  // For the Mailchimp Marketing documentation, see https://mailchimp.com/developer/marketing/.
  const mailchimpClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const pingResponse = await mailchimpClient.marketing.ping.get();

  ctx.body = pingResponse;
});

module.exports = integration;
