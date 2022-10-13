import { IOAuthToken } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

async function getOrganizationInfo(token: IOAuthToken) {
  // Replace the Dynamics API Permission to get the server root
  const serverUrl = `${token.scope.replace('/user_impersonation', '')}/api/data/v9.2/WhoAmI`;
  const instanceResponse = await superagent
    .get(serverUrl)
    .set('Authorization', `Bearer ${token.access_token}`)
    .set('Accept', 'application/json');
  return instanceResponse.body;
}

export { getOrganizationInfo };
