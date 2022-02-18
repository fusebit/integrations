const config = {
  handler: '@fusebit-int/slack-connector',
  configuration: {
    mode: { useProduction: false },
    scope: 'chat:write users:read channels:read channels:join chat:write.public',
    clientId: '5f1cd1640b93900566cf3367d9c77b3a41bf9428d8ea9fcfc734cfd566b838cd',
    clientSecret: '9072f60eb39ee77e46435e0f8fa046dacaccfc31f15f05bc3a602c74f0769144',
    refreshErrorLimit: 100000,
    refreshInitialBackoff: 100000,
    refreshWaitCountLimit: 100000,
    refreshBackoffIncrement: 100000,
    accessTokenExpirationBuffer: 500,
  },
  encodedFiles: {},
  mountUrl: '/v2/account/acc-a1895767bfe249fd/subscription/sub-dfe4c6b5cd3744cb/integration/cancel-test-connector',
};
let handler = '@fusebit-int/slack-connector';
handler = handler[0] === '.' ? `${__dirname}/${handler}` : handler;
module.exports = require('@fusebit-int/framework').Internal.Handler(handler, config);
