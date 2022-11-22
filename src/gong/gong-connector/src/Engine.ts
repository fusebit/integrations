import { OAuthEngine } from '@fusebit-int/oauth-connector';
import { Connector } from '@fusebit-int/framework';
import superagent from 'superagent';

class GongOAuthEngine extends OAuthEngine {
  protected async fetchOAuthToken(ctx: Connector.Types.Context, params: Record<string, string>) {
    const tokenUrl = new URL(this.getTokenUrl(ctx));
    tokenUrl.searchParams.set('grant_type', params.grant_type);

    if (params.code) {
      tokenUrl.searchParams.set('code', params.code);
      tokenUrl.searchParams.set('redirect_uri', params.redirect_uri);
      tokenUrl.searchParams.set('client_id', params.client_id);
    }

    if (params.refresh_token) {
      tokenUrl.searchParams.set('refresh_token', params.refresh_token);
    }

    const basicAuth = Buffer.from(`${params.client_id}:${params.client_secret}`).toString('base64');

    try {
      const response = await superagent
        .post(tokenUrl.toString())
        .set('Accept', 'application/json')
        .set('User-Agent', 'fusebit/oauth')
        .set('Authorization', `Basic ${basicAuth}`);

      return this.normalizeOAuthToken(response.body);
    } catch (error) {
      throw new Error(`Unable to connect to tokenUrl ${tokenUrl}: ${error}`);
    }
  }
}

export default GongOAuthEngine;
