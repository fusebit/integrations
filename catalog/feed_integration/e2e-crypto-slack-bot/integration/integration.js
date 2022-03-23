const { Integration } = require('@fusebit-int/framework');
const { request } = require('undici');

const integration = new Integration();
const router = integration.router;

const connectorName = 'slackConnector';
const ticker = 'BTC';

router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Get ticker info and generate message
  const range = await get10dayRange(ctx, ticker);
  const rate = await getRate(ctx, ticker);
  const message = printTickerMessage(ticker, rate, range.high, range.low);

  // Send message as a Slack DM
  const slackClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const slackUserId = slackClient.fusebit.credentials.authed_user.id;
  const result = await slackClient.chat.postMessage({
    text: message,
    channel: slackUserId,
  });

  ctx.body = { message: message };
});

// Run this on a schedule
integration.cron.on('/check-delta', async (ctx) => {
  // Get ticker range
  const range = await get10dayRange(ctx, ticker);
  const rate = await getRate(ctx, ticker);

  // If the ticker is on a 10-day high/low, notify user
  if (rate > range.high || rate < range.low) {
    // Get installs
    const installs = await integration.service.listInstalls(ctx, 'fusebit.parentEntityId', 'crypto-notification-bot');

    // Send a Slack DM to all users who installed this bot
    const promises = installs.items.map(async (install) => {
      const slackClient = await integration.service.getSdk(ctx, connectorName, install.id);
      const slackUserId = slackClient.fusebit.credentials.authed_user.id;
      const result = await slackClient.chat.postMessage({
        text: printTickerMessage(ticker, rate, range.high, range.low),
        channel: slackUserId,
      });
    });

    await Promise.all(promises);
  }
});

function printTickerMessage(ticker, rate, high, low) {
  const isOver = rate > high;
  const isUnder = rate < low;

  return `${ticker}
    ${isOver ? `Above 10-day range` : isUnder ? `Below 10-day range` : `Within 10-day range`}
    
    10-day high: $${high}
    10-day low: $${low}
    Current: $${rate}`;
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
