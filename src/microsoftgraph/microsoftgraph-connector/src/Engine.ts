import { OAuthEngine, IOAuthToken } from '@fusebit-int/oauth-connector';
import { Internal } from '@fusebit-int/framework';
import { getAzureTenant } from './utils';

class MicrosoftGraphOAuthEngine extends OAuthEngine {
  protected async enrichInitialToken(ctx: Internal.Types.Context, token: IOAuthToken) {
    const { id, displayName, tenantType } = await getAzureTenant(token);
    token.params = { tenantId: id, displayName, tenantType };
  }
}

export default MicrosoftGraphOAuthEngine;
