import { IOAuthToken } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

async function getAzureTenant(token: IOAuthToken) {
  const instanceResponse = await superagent
    .get('https://graph.microsoft.com/v1.0/organization')
    .set('Authorization', `Bearer ${token.access_token}`)
    .set('Accept', 'application/json');
  return instanceResponse.body.value[0];
}

export { getAzureTenant };
