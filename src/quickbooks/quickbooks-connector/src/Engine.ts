import { OAuthEngine, IOAuthToken } from '@fusebit-int/oauth-connector';
import { Internal } from '@fusebit-int/framework';

class QuickBooksOAuthEngine extends OAuthEngine {
  protected async enrichInitialToken(ctx: Internal.Types.Context, token: IOAuthToken) {
    token.params = { realmId: ctx.query.realmId };
  }
}

export default QuickBooksOAuthEngine;
