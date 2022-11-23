import { IOAuthToken } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

export interface IOrganizationInfo {
  organizationName: string;
  organizationId: string;
  businessUnitId: string;
  userId: string;
}

async function getOrganizationInfo(token: IOAuthToken): Promise<IOrganizationInfo> {
  // Replace the Dynamics API Permission to get the server root
  const serverUrl = `${token.scope.replace('/user_impersonation', '')}/api/data/v9.2`;
  const instanceResponse = await superagent
    .get(`${serverUrl}/WhoAmI`)
    .set('Authorization', `Bearer ${token.access_token}`)
    .set('Accept', 'application/json');
  const { OrganizationId, BusinessUnitId, UserId } = instanceResponse.body;
  // Organization name
  const organizationResponse = await superagent
    .get(`${serverUrl}/organizations(${OrganizationId})`)
    .set('Authorization', `Bearer ${token.access_token}`)
    .set('Accept', 'application/json');
  const { name } = organizationResponse.body;

  return { organizationName: name, organizationId: OrganizationId, businessUnitId: BusinessUnitId, userId: UserId };
}

export { getOrganizationInfo };
