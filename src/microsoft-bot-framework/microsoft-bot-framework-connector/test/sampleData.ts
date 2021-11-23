export const sampleEvent = {
  text: 'Hi, bot.',
  textFormat: 'plain',
  attachments: [{ contentType: 'text/html', content: '<div>Hi, bot.</div>' }],
  type: 'message',
  timestamp: '2021-11-11T19:19:29.0738721Z',
  localTimestamp: '2021-11-11T16:19:29.0738721-03:00',
  id: '1636658369053',
  channelId: 'msteams',
  serviceUrl: 'https://smba.trafficmanager.net/br/',
  from: {
    id: '29:1pQAsM4XPwEKh1oDWwh45xSWm4M-Kd2c0fHKlTXJRdyab6jWhasHdBuOn_Sf2zol4tYjWT6HpasAFp9UhRaePkw',
    name: 'Bruno Krebs',
    aadObjectId: '83365ad2-6204-4812-a6e2-e1e5e9e9408c',
  },
  conversation: {
    conversationType: 'personal',
    tenantId: '56c94ff1-0f49-4b7d-a9b4-c2a1063d05c7',
    id: 'a:1cTrDNWhStb608c4ZKbICUuIyW-s4DFbhuNNVNHxPkIWa54g3JDzbE0UruioRucAvVU55SHgiNiyDxw3k1rFgXhZxaXJm7hJN5ItAqc0JEzfERqwJDlq7nMznZpO49YNs',
  },
  recipient: { id: '28:16a42606-f57e-444e-9a97-3d703d05f436', name: 'IAmBot' },
  entities: [
    {
      locale: 'en-US',
      country: 'US',
      platform: 'Web',
      timezone: 'America/Sao_Paulo',
      type: 'clientInfo',
    },
  ],
  channelData: { tenant: { id: '56c94ff1-0f49-4b7d-a9b4-c2a1063d05c7' } },
  locale: 'en-US',
  localTimezone: 'America/Sao_Paulo',
};

export const sampleHeaders = {
  authorization:
    'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ilp5R2gxR2JCTDh4ZDFrT3hSWWNoYzFWUFNRUSIsInR5cCI6IkpXVCIsIng1dCI6Ilp5R2gxR2JCTDh4ZDFrT3hSWWNoYzFWUFNRUSJ9.eyJzZXJ2aWNldXJsIjoiaHR0cHM6Ly9zbWJhLnRyYWZmaWNtYW5hZ2VyLm5ldC9ici8iLCJuYmYiOjE2MzY2NTgzNjksImV4cCI6MTYzNjY2MTk2OSwiaXNzIjoiaHR0cHM6Ly9hcGkuYm90ZnJhbWV3b3JrLmNvbSIsImF1ZCI6IjE2YTQyNjA2LWY1N2UtNDQ0ZS05YTk3LTNkNzAzZDA1ZjQzNiJ9.BrITHR-hG0HZcnuOCCbxDmEk4cWjClx2RLXQnVNtrmKlHYZXx_ly_gP6GCUCNUw_44j1lRCrLkYBFteD0wyRyP9wNt4UgBwpUCTBQZm1ikfDqMJRwx0Soz0BZd12CO2Vfkh6YFTt5iv_5dLLI1eU4oTpzJHvUWCa7XjfOaEgbxEvzWJz6CThXgSIZ1bd4jDTlR6LEpJbLSSyn_qjWsIKbK519fzCU9ttiDUii2v0xsRpabcZl6sD_LOZ15Puzu4N-d7bPXn4qhpcide3SpmQK90wL2aAHpRrSd8lSynNoxVz6PBG-KepTDx-tKWgy6vffX3zLGcCLB2JUe5ZyrL4Lg',
};

export const sampleConfig = {
  handler: '@fusebit-int/microsoft-bot-framework-connector',
  configuration: {
    mode: {
      useProduction: true,
    },
    scope: 'https://api.botframework.com/.default',
    clientId: '16a42606-f57e-444e-9a97-3d703d05f436',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    constants: {
      urls: {
        production: {
          tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        },
        webhookUrl:
          'https://api.fusebit.io/v2/account/acc-c2500086d0bc43ef/subscription/sub-ebffdeb2c7634122/connector/ms-bot-framework/api/fusebit_webhook_event',
      },
    },
    clientSecret: 'Lod7Q~oQ-unJeVOCWPNinYD4fCH5s3BpzkgDj',
    defaultEventHandler: 'ms-teams',
  },
  mountUrl: '/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/integration/my-connector-899',
};
