import { OAuthEngine } from '@fusebit-int/oauth-connector';
import { Connector } from '@fusebit-int/framework';
import superagent from 'superagent';

class RedditOAuthEngine extends OAuthEngine {
  protected async fetchOAuthToken(ctx: Connector.Types.Context, params: Record<string, string>) {
    const tokenUrl = this.getTokenUrl(ctx);
    try {
      const basicAuthPlain = `${params.client_id}:${params.client_secret}`;
      const basicAuth = new Buffer(basicAuthPlain).toString('base64');
      const response = await superagent
        .post(tokenUrl)
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .type('form')
        .send(params);

      return this.normalizeOAuthToken(response.body);
    } catch (error) {
      throw new Error(`Unable to connect to tokenUrl ${tokenUrl}: ${error}`);
    }
  }

  public async getAuthorizationUrl(ctx: Connector.Types.Context) {
    const defaultAuthorizationUrl = await super.getAuthorizationUrl(ctx);
    return `${defaultAuthorizationUrl}&duration=permanent`;
  }
}

export default RedditOAuthEngine;
