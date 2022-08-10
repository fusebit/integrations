const superagent = require('superagent');

const appId = '<mparticle app id>';
const appSecret = '<mparticle app secret>';

const dispatchResult = async (environment, userIdentity, event) => {
  if (!event) {
    return;
  }

  const auth = `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`;

  const payload = {
    environment,
    user_identities: userIdentity,
    events: [event],
  };

  const result = await superagent
    .post('https://s2s.mparticle.com/v2/events')
    .set('Authorization', auth)
    .set('User-Agent', 'fusebit/mparticle')
    .send(payload);

  return result;
};

module.exports = { dispatchResult };
