const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'mastodonConnector';

// Test Endpoint: Get all favorites stored in the Mastodon account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const mastodonClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://docs.joinmastodon.org/client/intro/
  const favorites = await mastodonClient.get('/api/v1/favourites');

  ctx.body = {
    message: `Successfully loaded ${favorites.length} from your mastodon account.`,
  };
});

module.exports = integration;
