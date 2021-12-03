export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  authorization: 'Bearer token',
  ping_event: {
    'x-signature-ed25519': sampleEvent.ping_event.headers['x-signature-ed25519'],
    'x-signature-timestamp': sampleEvent.ping_event.headers['x-signature-timestamp'],
  },
  slash_command: {
    'x-signature-ed25519': sampleEvent.slash_command.headers['x-signature-ed25519'],
    'x-signature-timestamp': sampleEvent.slash_command.headers['x-signature-timestamp'],
  },
};

export const sampleConfig = {
  handler: '@fusebit-int/discord-connector',
  configuration: {
    scope: 'bot',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    authorizationUrl: 'https://discord.com/api/oauth2/authorize',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/discord-test-connector',
};

export const guild = {
  guild_id: '889691384154570762',
};

export const publicKey = '469f796577ea50f43022c7180c78368127b248944753f99d19a24fb372efea65';
