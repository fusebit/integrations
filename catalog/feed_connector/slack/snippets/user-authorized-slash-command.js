const code = `

// Ensure you have @slack/webhook specified in your package.json
const { IncomingWebhook } = require('@slack/webhook');

/**
 * Confirm the command is received
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
router.post('/api/fusebit/webhook/event/immediate-response', (ctx) => {
    const { command } = ctx.req.body;
    ctx.body = {
      text: \`:hourglass_flowing_sand: We got the command!, we are running the <@\${command}> command.\`,
      response_type: 'ephemeral',
    };
  });
/**
 * Respond to a Slash command
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
 integration.event.on('/:<% connectorName %>/webhook/slash-command/:command', async (ctx) => {
    try {
        const { team_id, user_id, api_app_id: app_id } = ctx.req.body.data;

        const installs = await integration.webhook.searchInstalls(ctx, '<% connectorName %>', {
          app_id,
          team_id,
          user_id,
        });
    
        const slackClient = await integration.service.getSdk(ctx, '<% connectorName %>', installs[0].id);
    
        await slackClient.chat.postMessage({
          text: 'Command processing finished',
        });
        
      } catch (error) {
        const webhook = new IncomingWebhook(ctx.req.body.data.response_url);

        // Detect if the error is coming because no Installs were returned
        if (error.code === 'INSTALLATIONS_NOT_FOUND') {
          await webhook.send({ text: 'Please authorize the application to use commands' });
        } else {
          // Something else failed, inform the user
          await webhook.send({ text: error.message });
        }
      }
 });
`;

module.exports = {
  name: 'Respond to Incoming Slash Commands',
  description:
    'Respond to incoming Slash Commands using Immediate Response within 3 seconds (required by Slack). Then, check to see if the user has an existing Install in Fusebit and respond accordingly.',
  code,
};
