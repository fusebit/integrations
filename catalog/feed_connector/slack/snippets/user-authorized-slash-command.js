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
        const { team_id, user_id, api_app_id: app_id, channel_id } = ctx.req.body.data;

        const installs = await integration.webhook.searchInstalls(ctx, '<% connectorName %>', {
          app_id,
          team_id,
          user_id,
        });
    
        const slackClient = await integration.service.getSdk(ctx, '<% connectorName %>', installs[0].id);
    
        await slackClient.chat.postMessage({
          text: 'Command processing finished',
          channel: channel_id,
        });
        
      } catch (error) {
        const response_url = ctx.req.body.data.response_url;

        if (response_url) {
          const webhook = new IncomingWebhook(response_url);
          await webhook.send({ text: 'You need to authorize the application to access this command', channel:  channel_id});
        }
      }
 });
`;

module.exports = {
  name: 'Slash commands with required user authorization',
  description: 'Use Slash commands that require the user to authorize the Slack application to perform commands.',
  code,
};
