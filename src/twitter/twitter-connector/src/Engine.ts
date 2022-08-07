import { IOAuthToken, OAuthEngine } from '@fusebit-int/oauth-connector';
import { Connector } from '@fusebit-int/framework';
import superagent from 'superagent';

class TwitterOAuthEngine extends OAuthEngine {
  protected async fetchOAuthToken(ctx: Connector.Types.Context, params: Record<string, string>) {
    const tokenUrl = this.getTokenUrl(ctx);
    try {
      const basicAuthPlain = `${params.client_id}:${params.client_secret}`;
      const basicAuth = Buffer.from(basicAuthPlain).toString('base64');
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
    const url = new URL(defaultAuthorizationUrl);
    url.searchParams.append('code_challenge', this.cfg.codeChallenge as string);
    url.searchParams.append('code_challenge_method', this.cfg.codeChallengeMethod || 'plain');
    return url.toString();
  }

  public async getAccessToken(authorizationCode: string, ctx: Connector.Types.Context): Promise<IOAuthToken> {
    const params: Record<string, string> = {
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      redirect_uri: this.getRedirectUri(),
    };

    if (this.cfg.codeChallenge) {
      params.code_verifier = this.cfg.codeChallenge;
    }

    return this.fetchOAuthToken(ctx, params);
  }
}

export default TwitterOAuthEngine;
