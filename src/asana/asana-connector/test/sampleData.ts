export const WebhookId = '0949217d-ddca-436a-8f2e-36dfd09566ac';

export const sampleChallengeCtx = {
  params: { webhookId: WebhookId },
  req: {
    method: 'POST',
    headers: {
      'x-hook-secret': 'cfecd97ea57de2b55a0a1a343c16fe3e',
    },
    body: {
      events: [],
    },
  },
  res: {},
};

export const sampleEventCtx = {
  params: { webhookId: WebhookId },
  req: {
    method: 'POST',
    url: `/api/fusebit_webhook_event/${WebhookId}`,
    headers: {
      'x-hook-signature': '11c89fb59db2a2cfe5eef26a3d7dc77d3ad0bbdd7f23700d7aff2fe6ff8e2581',
      'x-asana-request-signature': '11c89fb59db2a2cfe5eef26a3d7dc77d3ad0bbdd7f23700d7aff2fe6ff8e2581',
    },
    body: {
      events: [
        {
          user: {
            gid: '1198829643564474',
            resource_type: 'user',
          },
          created_at: '2021-10-29T02:44:21.987Z',
          action: 'changed',
          parent: null,
          change: {
            field: 'completed',
            action: 'changed',
          },
          resource: {
            gid: '1199170056173519',
            resource_type: 'task',
            resource_subtype: 'default_task',
          },
        },
        {
          user: {
            gid: '1198829643564474',
            resource_type: 'user',
          },
          created_at: '2021-10-29T02:44:21.987Z',
          action: 'changed',
          resource: {
            gid: '1199170056173519',
            resource_type: 'task',
            resource_subtype: 'default_task',
          },
          parent: null,
          change: {
            field: 'completed_at',
            action: 'changed',
          },
        },
      ],
    },
  },
  res: {},
};

export const sampleEvent = sampleEventCtx.req.body.events[0];

export const sampleConfig = {
  handler: '@fusebit-int/asana-connector',
  configuration: {
    mode: { useProduction: true },
    scope: '',
    clientId: '123.456',
    clientSecret: 'abcdefg',
    refreshErrorLimit: 100000,
    refreshInitialBackoff: 100000,
    refreshWaitCountLimit: 100000,
    refreshBackoffIncrement: 100000,
    accessTokenExpirationBuffer: 500,
    constants: {
      urls: {
        production: {
          tokenUrl: 'https://app.asana.com/-/oauth_token',
          authorizationUrl: 'https://app.asana.com/-/oauth_authorize',
        },
        proxy: {
          tokenUrl:
            'https://stage.us-west-2.fusebit.io/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/connector/my-connector-899/proxy/asana/oauth/token',
          authorizationUrl:
            'https://stage.us-west-2.fusebit.io/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/connector/my-connector-899/proxy/asana/oauth/authorize',
        },
        webhookUrl:
          'https://stage.us-west-2.fusebit.io/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/connector/my-connector-899/api/fusebit_webhook_event',
        callbackUrl:
          'https://stage.us-west-2.fusebit.io/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/connector/my-connector-899/api/callback',
      },
    },
  },
  mountUrl: '/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/integration/my-connector-899',
};

// {"events":[{"user":{"gid":"1198829643564474","resource_type":"user"},"created_at":"2021-10-29T02:44:21.987Z","action":"changed","parent":null,"change":{"field":"completed","action":"changed"},"resource":{"gid":"1199170056173519","resource_type":"task","resource_subtype":"default_task"}},{"user":{"gid":"1198829643564474","resource_type":"user"},"created_at":"2021-10-29T02:44:21.987Z","action":"changed","resource":{"gid":"1199170056173519","resource_type":"task","resource_subtype":"default_task"},"parent":null,"change":{"field":"completed_at","action":"changed"}}]}
// {"events":[{"user":{"gid":"1198829643564474","resource_type":"user"},"created_at":"2021-10-29T02:44:21.987Z","action":"changed","parent":null,"change":{"field":"completed","action":"changed"},"resource":{"gid":"1199170056173519","resource_type":"task","resource_subtype":"default_task"},"webhookId":"fd8db1cb-e675-41c4-a008-d5b5a1557969"},{"user":{"gid":"1198829643564474","resource_type":"user"},"created_at":"2021-10-29T02:44:21.987Z","action":"changed","resource":{"gid":"1199170056173519","resource_type":"task","resource_subtype":"default_task"},"parent":null,"change":{"field":"completed_at","action":"changed"},"webhookId":"fd8db1cb-e675-41c4-a008-d5b5a1557969"}]}
