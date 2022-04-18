const code = `
/**
 * Respond to messages in channels that the bot has access to
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 integration.event.on('/:componentName/webhook/event_callback', async (ctx) => {
   const slackClient = await integration.service.getSdk(ctx, ctx.params.componentName, ctx.req.body.installIds[0]);
 
   const messagingUser = ctx.req.body.data.event.user;
   const authorizedListeningUser = ctx.req.body.data.authorizations[0].user_id;
 
   if (messagingUser === authorizedListeningUser) {
     console.log('Skipping to avoid recursive response (i.e., infinite loop).');
     return;
   }
 
   const text = ctx.req.body.data.event.text;
   await slackClient.chat.postMessage({
     text: \`I'm responding via a webhook.  I was alerted when <@\${messagingUser}> sent the message: \n\n "\${text}"\`,
     channel: ctx.req.body.data.event.channel,
   });
 });
`;

module.exports = {
  name: 'Respond to messages in channels that the bot has access to',
  description: 'Respond to messages in channels that the bot has access to',
  code,
};
