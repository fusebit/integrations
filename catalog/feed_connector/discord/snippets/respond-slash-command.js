const code = `
/**
 * Respond to an incoming Slash Command 
 * 
 * @param tenantId {tenantId} Tenant Id
 * @param guild {guild} Discord Guild Id
 */

 // Respond to a Slash command
 integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
   const {
     data: { data: event },
   } = ctx.req.body;
   console.log('received event', event);
   const {
     data: { application_id, token },
   } = ctx.req.body;
   /**
    * You can use the following endpoints to edit your initial response or send followup messages:
     PATCH /webhooks/<application_id>/<interaction_token>/messages/@original to edit your initial response to an Interaction
     DELETE /webhooks/<application_id>/<interaction_token>/messages/@original to delete your initial response to an Interaction
     POST /webhooks/<application_id>/<interaction_token> to send a new followup message
     PATCH /webhooks/<application_id>/<interaction_token>/messages/<message_id> to edit a message sent with that token
    */
   await superagent.post(\`https://discord.com/api/v8/webhooks/\${application_id}/\${token}\`).send({
     content: 'It works!',
   });
 });

`;

module.exports = {
  name: 'Respond to a Slash Command',
  description: 'Listen for and respond to a Slash Command using the Fusebit webhook infrastructure',
  code,
};
