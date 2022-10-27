const method = async (ctx) => {
  // Learn how subscription lifecycle works https://learn.microsoft.com/en-us/graph/webhooks-lifecycle
  const { subscriptionId, organizationId } = ctx.req.body.data;
  const installs = await integration.webhook.searchInstalls(ctx, connectorName, {
    tenant: organizationId,
  });
  if (installs.length) {
    const client = await integration.webhook.getSdk(ctx, connectorName, installs[0].id);
    const now = new Date();
    // Extend 10 minutes the subscription
    now.setMinutes(now.getMinutes() + 10);
    const { expirationDateTime } = await client.update(subscriptionId, now.toISOString());

    // Note: This will keep renewing the subscription for ever unless you delete the subscription.
    ctx.body = `Subscription ${subscriptionId} updated, now expires at ${expirationDateTime}`;
  }
};

const code = `
/**
 * Use Fusebit's Event Handler to update an expired Microsoft Graph Webhook (Subscription)
 */
 integration.event.on('/:componentName/webhook/lifecycleEvent:reauthorizationRequired', ${method.toString()})
  `;

module.exports = {
  name: 'Renew an expired Webhook (Subscription)',
  description: "Renew an expired Webhook (Subscription) using Fusebit's built-in event handler",
  code,
};
