import { OAuthEngine, IOAuthToken } from '@fusebit-int/oauth-connector';
import { Internal } from '@fusebit-int/framework';
import { getOrganizationInfo } from './utils';

class MicrosoftDynamicsOAuthEngine extends OAuthEngine {
  protected async enrichInitialToken(ctx: Internal.Types.Context, token: IOAuthToken) {
    const { organizationId, userId, businessUnitId, organizationName } = await getOrganizationInfo(token);
    token.params = { organizationId, businessUnitId, userId, organizationName };
  }
}

export default MicrosoftDynamicsOAuthEngine;
