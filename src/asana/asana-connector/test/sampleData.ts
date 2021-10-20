export const sampleEvent = [{
  "action": "changed",
  "change": {
    "action": "changed",
    "added_value": {
      "gid": "12345",
      "resource_type": "user"
    },
    "field": "assignee",
    "new_value": {
      "gid": "12345",
      "resource_type": "user"
    },
    "removed_value": {
      "gid": "12345",
      "resource_type": "user"
    }
  },
  "created_at": "2012-02-22T02:06:58.147Z",
  "parent": {
    "gid": "12345",
    "resource_type": "task",
    "name": "Bug Task"
  },
  "resource": {
    "gid": "12345",
    "resource_type": "task",
    "name": "Bug Task"
  },
  "type": "task",
  "user": {
    "gid": "12345",
    "resource_type": "user",
    "name": "Greg Sanchez"
  }
}];

export const sampleHeaders = {
  'X-HOOK-SIGNATURE': 'TODO: Signing secret',
  'X-HOOK-SECRET': 'b537207f20cbfa02357cf448134da559e8bd39d61597dcd5631b8012eae53e81'
};

export const sampleConfig = {
  handler: '@fusebit-int/asana-connector',
  configuration: {
    mode: { useProduction: true },
    scope: '',
    clientId: '457394426995.2587641697399',
    clientSecret: '9c3ad1b104e06e32f06cac47ffdd5324',
    refreshErrorLimit: 100000,
    refreshInitialBackoff: 100000,
    refreshWaitCountLimit: 100000,
    refreshBackoffIncrement: 100000,
    accessTokenExpirationBuffer: 500,
    constants: {
      urls: {
        production: {
          tokenUrl: 'https://slack.com/api/oauth.v2.access',
          authorizationUrl: 'https://slack.com/oauth/v2/authorize',
        },
        proxy: {
          tokenUrl:
            'https://stage.us-west-2.fusebit.io/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/connector/my-connector-899/proxy/slack/oauth/token',
          authorizationUrl:
            'https://stage.us-west-2.fusebit.io/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/connector/my-connector-899/proxy/slack/oauth/authorize',
        },
        webhookUrl:
          'https://stage.us-west-2.fusebit.io/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/connector/my-connector-899/api/fusebit_webhook_event',
        callbackUrl:
          'https://stage.us-west-2.fusebit.io/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/connector/my-connector-899/api/callback',
      },
    },
    signingSecret: 'a4c7fd851ede968d29feb29d4a80acf5',
  },
  mountUrl: '/v2/account/acc-7a7faa6ffa3f4332/subscription/sub-041ebd4abfb34ebe/integration/my-connector-899',
};
