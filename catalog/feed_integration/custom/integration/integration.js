// Fusebit Integration
//
// Documentation: https://developer.fusebit.io/docs/custom-integrations

const { Integration } = require('@fusebit-int/framework');
const integration = (module.exports = new Integration());

integration.cron.on('/cron', async (ctx) => {
  // TODO Implement CRON-triggered integration logic here
  console.log('RUNNING CRON-TRIGGERED INTEGRATION');
});

integration.router.post('/api/tenant/:tenantId/test', async (ctx) => {
  // TODO Implement HTTP-triggered integration logic here
  console.log('RUNNING HTTP-TRIGGERED INTEGRATION');

  ctx.body = {
    message:
      `Congratulations, your integration executed successfully! ` +
      `Check out https://developer.fusebit.io/docs/custom-integrations to make it do something useful.`,
  };
});
