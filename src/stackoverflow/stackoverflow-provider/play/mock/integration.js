const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const router = integration.router;
const connectorName = '##CONNECTOR_NAME##';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);

  const user = await sdk.site('stackoverflow').get('/me');
  const networkAchievements = await sdk.network().get('/me/achievements');

  ctx.body = { userCount: user.items.length, networkAchievementsQuota: networkAchievements.quota_remaining };
});

module.exports = integration;
