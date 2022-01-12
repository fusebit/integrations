const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const router = integration.router;
const connectorName = 'test-play-quickbooks-con';

process.env.QUICKBOOKS_USE_SANDBOX = '1';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);

  const accounts = await sdk.findAccounts();

  ctx.body = { message: `Account total: ${accounts.QueryResponse.Account.length}` };
});

module.exports = integration;
