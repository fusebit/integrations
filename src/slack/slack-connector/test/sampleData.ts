export const sampleEvent = {
  token: 'R5ZUGOrzYpNHhR2bxtrTcqld',
  team_id: 'TDFBLCJV9',
  api_app_id: 'A02H9JVLHBR',
  event: {
    client_msg_id: '732905a8-7970-45c4-89e0-5805e24de2c9',
    type: 'message',
    text: 'Test Slack Message',
    user: 'UUPT2SQN7',
    ts: '1634184824.003300',
    team: 'TDFBLCJV9',
    blocks: [
      {
        type: 'rich_text',
        block_id: 'PwZ8Y',
        elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Test Slack Message' }] }],
      },
    ],
    channel: 'C02HHHZ5YHL',
    event_ts: '1634184824.003300',
    channel_type: 'channel',
  },
  type: 'event_callback',
  event_id: 'Ev02J3L6MH2M',
  event_time: 1634184824,
  authorizations: [
    { enterprise_id: null, team_id: 'TDFBLCJV9', user_id: 'U02HQAA7CJX', is_bot: true, is_enterprise_install: false },
  ],
  is_ext_shared_channel: false,
  event_context:
    '4-eyJldCI6Im1lc3NhZ2UiLCJ0aWQiOiJUREZCTENKVjkiLCJhaWQiOiJBMDJIOUpWTEhCUiIsImNpZCI6IkMwMkhISFo1WUhMIn0',
};

export const sampleHeaders = {
  'x-slack-signature': 'v0=4d7d0466a5886bef9f32a38ef6910edc6099da1f53606a117979ec515ebf433c',
  'x-slack-request-timestamp': '1634184825',
};

export const sampleConfig = {
  handler: '@fusebit-int/slack-connector',
  configuration: {
    mode: { useProduction: true },
    scope: 'chat:write users:read channels:read channels:join chat:write.public',
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
