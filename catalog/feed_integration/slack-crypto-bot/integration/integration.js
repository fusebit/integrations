const { Integration } = require('@fusebit-int/framework');
const { request } = require('undici');

const integration = new Integration();
const router = integration.router;

const connectorName = 'slackConnector';
const ticker = 'BTC';

router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Get ticker info and generate message
  const { message } = await getTickerData(ctx, ticker);

  // Send message as a Slack DM
  const slackClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const slackUserId = slackClient.fusebit.credentials.authed_user.id;
  const result = await slackClient.chat.postMessage({
    text: message,
    channel: slackUserId,
  });

  ctx.body = { message: message };
});

// This function is a scheduled job that will execute the check and let you know in a Slack DM.
// You need to add the following section in the Configuration/fusebit.json file to enable the job
// to run every hour.
//
// "schedule": [
//   {
//     "cron": "0 * * * *",
//     "endpoint": "/check-delta",
//     "timezone": "America/Los_Angeles"
//   }
// ]
integration.cron.on('/check-delta', async (ctx) => {
  // Get ticker range
  const { message, outsideRange } = await getTickerData(ctx, ticker);

  // If the ticker is on a 10-day high/low, notify user
  if (outsideRange) {
    // Get installs
    const installs = await integration.service.listInstalls(ctx);

    // Send a Slack DM to all users who installed this bot
    const promises = installs.items.map(async (install) => {
      const slackClient = await integration.service.getSdk(ctx, connectorName, install.id);
      const slackUserId = slackClient.fusebit.credentials.authed_user.id;
      const result = await slackClient.chat.postMessage({
        text: message,
        channel: slackUserId,
      });
    });

    await Promise.all(promises);
  }
});

async function getTickerData(ctx, ticker) {
  const range = await get10dayRange(ctx, ticker);
  const rate = await getRate(ctx, ticker);

  const isOver = rate > range.high;
  const isUnder = rate < range.low;

  return {
    outsideRange: isOver || isUnder,
    message: `${ticker}
    ${isOver ? `Above 10-day range` : isUnder ? `Below 10-day range` : `Within 10-day range`}
    
    10-day high: $${range.high}
    10-day low: $${range.low}
    Current: $${rate}`,
  };
}

async function getRate(ctx, ticker) {
  const { statusCode, body } = await request(
    `https://rest.coinapi.io/v1/exchangerate/${ticker}/USD/?time=${new Date().toISOString()}`,
    {
      headers: {
        'X-CoinAPI-Key': ctx.state.manager.config.configuration.coinApiKey,
      },
    }
  );

  const response = await body.json();
  if (statusCode === 200 && response && response.rate) {
    return response.rate;
  } else {
    throw new Error('Could not obtain rate');
  }
}

async function get10dayRange(ctx, ticker) {
  const now = new Date();
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(now.getDate() - 10);

  const { statusCode, body } = await request(
    `https://rest.coinapi.io/v1/exchangerate/${ticker}/USD/history?period_id=10DAY&time_start=${tenDaysAgo.toISOString()}&time_end=${now.toISOString()}`,
    {
      headers: {
        'X-CoinAPI-Key': ctx.state.manager.config.configuration.coinApiKey,
      },
    }
  );

  const periods = await body.json();
  if (statusCode === 200 && periods.length > 0) {
    // The API operates on 10-day periods that are fixed. If the date range spans
    // two periods, take the latest one
    const latestPeriod = periods[periods.length - 1];
    return {
      high: latestPeriod.rate_high,
      low: latestPeriod.rate_low,
    };
  } else {
    throw new Error('Could not obtain 10-day high/low value');
  }
}

module.exports = integration;
