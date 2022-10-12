import { OAuthEngine, IOAuthToken } from '@fusebit-int/oauth-connector';
import { Internal } from '@fusebit-int/framework';
import { getOrganizationInfo } from './utils';

class MicrosoftDynamicsOAuthEngine extends OAuthEngine {
  protected async enrichInitialToken(ctx: Internal.Types.Context, token: IOAuthToken) {
    const { OrganizationId, BusinessUnitId, UserId } = await getOrganizationInfo(token);
    token.params = { organizationId: OrganizationId, businessUnitId: BusinessUnitId, userId: UserId };
  }
}

export default MicrosoftDynamicsOAuthEngine;
