import superagent from 'superagent';
import { Connector, Internal } from '@fusebit-int/framework';

import { IOAuthConfig, IOAuthToken, IOAuthTokenWithRefresh } from './OAuthTypes';

class OAuthEngine {
  public cfg: IOAuthConfig;

  constructor(cfg: IOAuthConfig) {
    this.cfg = cfg;
  }

  public setMountUrl(mountUrl: string) {
    this.cfg.mountUrl = mountUrl;
  }

  public async deleteUser(ctx: Internal.Types.Context, lookupKey: string) {
    return ctx.state.identityClient?.delete(lookupKey);
  }

  /**
   * Creates the fully formed web authorization URL to start the authorization flow.
   * @param {Connector.Types.Context} ctx Request context.
   */
  public async getAuthorizationUrl(ctx: Connector.Types.Context) {
    const params = new URLSearchParams({
      response_type: 'code',
      scope: this.cfg.scope,
      state: ctx.query.session,
      client_id: this.cfg.clientId,
      redirect_uri: this.getRedirectUri(),
    });

    if (this.cfg.audience) {
      params.append('audience', this.cfg.audience);
    }

    const query = `${params.toString()}${this.cfg.extraParams ? `&${this.cfg.extraParams}` : ''}`;

    // If the configured authorization URL is absolute, use it verbatim.
    // If it is relative, add the connector's endpoint in front of it.
    return this.cfg.authorizationUrl.match(/^https?:\/\//i)
      ? `${this.cfg.authorizationUrl}?${query}`
      : `${ctx.state.params.endpoint}${this.cfg.authorizationUrl}?${query}`;
  }

  /**
   * Generate OAuth redirect URI
   * @returns OAuth redirect URI
   */
  protected getRedirectUri(): string {
    return this.cfg.callbackUrl;
  }

  /**
   * Generate OAuth token URL
   * @param ctx Request context
   * @returns OAuth token URL
   */
  protected getTokenUrl(ctx: Internal.Types.Context): string {
    // If the configured token URL is absolute, use it verbatim.
    // If it is relative, add the connector's endpoint in front of it.
    return this.cfg.tokenUrl.match(/^https?:\/\//i)
      ? this.cfg.tokenUrl
      : `${ctx.state.params.endpoint}${this.cfg.tokenUrl}`;
  }

  /**
   * Enrich the token with any additional attributes from the ctx.
   */
  protected async enrichInitialToken(ctx: Internal.Types.Context, token: IOAuthToken) {}

  /**
   * Convert the successful callback into a token via getAccessToken.
   */
  public async convertAccessCodeToToken(ctx: Internal.Types.Context, lookupKey: string, code: string) {
    const token = await this.getAccessToken(code, ctx);
    if (!isNaN(Number(token.expires_in))) {
      token.expires_at = Date.now() + Number(token.expires_in) * 1000;
    }

    token.status = 'authenticated';
    token.timestamp = Date.now();

    await this.enrichInitialToken(ctx, token);

    await ctx.state.identityClient?.saveTokenToSession(token, lookupKey);

    return token;
  }

  /**
   * Fetches callback url from session that is managing the connector
   */
  public async redirectToCallback(ctx: Internal.Types.Context) {
    const callbackUrl = await ctx.state.identityClient!.getCallbackUrl(ctx);
    ctx.redirect(callbackUrl);
  }

  /**
   * Workaround an issue with Salesforce whereby Salesforce does not return the 'expires_in' property.
   * Assume the token has 1h of validity in this case (Salesforce default is 2h, but it is configurable).
   * @param token The OAuth response from the authorization code exchange or refresh token exchange
   */
  protected normalizeOAuthToken(token: IOAuthToken): IOAuthToken {
    if (token.refresh_token && isNaN(Number(token.expires_in))) {
      token.expires_in = 3600;
    }
    return token;
  }

  protected async fetchOAuthToken(ctx: Connector.Types.Context, params: Record<string, string>): Promise<IOAuthToken> {
    const tokenUrl = this.getTokenUrl(ctx);
    try {
      const response = await superagent
        .post(tokenUrl)
        .set('User-Agent', 'fusebit/oauth')
        .set('Accept', 'application/json')
        .type('form')
        .send(params);

      return this.normalizeOAuthToken(response.body);
    } catch (error) {
      throw new Error(
        `Unable to connect to tokenUrl ${tokenUrl}: ${error}, ${(error as any).response?.body?.error_description}`
      );
    }
  }

  /**
   * Exchanges the OAuth authorization code for the access and refresh tokens.
   * @param {string} authorizationCode The authorization_code supplied to the OAuth callback upon successful
   *                                   authorization flow.
   * @param {string} ctx Request context
   */
  public async getAccessToken(authorizationCode: string, ctx: Connector.Types.Context): Promise<IOAuthToken> {
    const params = {
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      redirect_uri: this.getRedirectUri(),
    };

    return this.fetchOAuthToken(ctx, params);
  }

  /**
   * Obtains a new access token using refresh token.
   * @param {*} token An object representing the result of the getAccessToken call. It contains refresh_token.
   * @param {Connector.Types.Context} ctx Request context
   */
  public async refreshAccessToken(existingToken: IOAuthTokenWithRefresh, ctx: Connector.Types.Context) {
    const params = {
      grant_type: 'refresh_token',
      refresh_token: existingToken.refresh_token,
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      redirect_uri: this.getRedirectUri(),
    };
    const fetchedToken = await this.fetchOAuthToken(ctx, params);

    return { ...existingToken, ...fetchedToken };
  }

  /**
   * Returns a valid access token to the vendor's system representing the vendor's user described by the Context.
   * For the vendor's system, if the currently stored access token is expired or nearing expiry, and a refresh
   * token is available, a new access token is obtained, stored for future use, and returned. If a current
   * access token cannot be returned, an exception is thrown.
   * @param {*} Context The vendor user Context
   */
  public async ensureAccessToken(ctx: Internal.Types.Context, lookupKey: string, identity = true) {
    let token: IOAuthToken | undefined;
    const tokenRw = identity
      ? {
          get: ctx.state.identityClient!.getToken,
          put: ctx.state.identityClient!.updateToken,
          delete: ctx.state.identityClient!.delete,
        }
      : {
          get: ctx.state.identityClient!.loadTokenFromSession,
          put: ctx.state.identityClient!.saveTokenToSession,
          delete: () => {},
        };

    try {
      token = await tokenRw.get(lookupKey);
    } catch (e) {
      throw e;
    }

    if (!token) {
      return undefined;
    }

    if (token.status === 'refreshing') {
      // Wait for the currently ongoing refresh operation in a different instance to finish
      return this.waitForRefreshedAccessToken(
        ctx,
        lookupKey,
        this.cfg.refreshWaitCountLimit,
        this.cfg.refreshInitialBackoff,
        tokenRw
      );
    } else {
      // Get access token for "this" OAuth connector
      return this.ensureLocalAccessToken(ctx, lookupKey, tokenRw);
    }
  }

  protected async ensureLocalAccessToken(ctx: Internal.Types.Context, lookupKey: string, tokenRw: any) {
    let token: IOAuthToken = await tokenRw.get(lookupKey);
    const accessTokenExpirationBuffer = this.cfg.accessTokenExpirationBuffer || 0;
    if (
      token.access_token &&
      (token.expires_at === undefined || token.expires_at > Date.now() + accessTokenExpirationBuffer)
    ) {
      return token;
    }
    if (!token.refresh_token && !token.access_token) {
      const error = (token as { error?: string }).error;
      const errorMessageString = error ? `"${error}". ` : '';
      throw new Error(
        `${errorMessageString}Access token and Refresh token are both missing on object: ${JSON.stringify(
          Object.keys(token)
        )}`
      );
    }

    if (token.refresh_token) {
      token.status = 'refreshing';
      try {
        await tokenRw.put(token, lookupKey);

        token = await this.refreshAccessToken(token as IOAuthTokenWithRefresh, ctx);

        if (!isNaN(Number(token.expires_in))) {
          token.expires_at = Date.now() + Number(token.expires_in) * 1000;
        }

        token.status = 'authenticated';
        token.refreshErrorCount = 0;

        await tokenRw.put(token, lookupKey);

        return token;
      } catch (e) {
        if (token.refreshErrorCount > this.cfg.refreshErrorLimit) {
          await ctx.state.identityClient?.delete(lookupKey);
          throw new Error(
            `Error refreshing access token. Maximum number of attempts exceeded, identity ${lookupKey} has been deleted: ${e.message}`
          );
        } else {
          token.refreshErrorCount = (token.refreshErrorCount || 0) + 1;
          token.status = 'refresh_error';
          await tokenRw.put(token, lookupKey);
          throw new Error(
            `Error refreshing access token, attempt ${token.refreshErrorCount} out of ${this.cfg.refreshErrorLimit}: ${e.message}`
          );
        }
      }
    }

    throw new Error('Access token is expired and cannot be refreshed because the refresh token is not present.');
  }

  protected async waitForRefreshedAccessToken(
    ctx: Internal.Types.Context,
    lookupKey: string,
    count: number,
    backoff: number,
    tokenRw: any
  ) {
    if (count <= 0) {
      throw new Error(
        'Error refreshing access token. Waiting for the access token to be refreshed exceeded the maximum time'
      );
    }

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        let token: IOAuthToken;
        try {
          token = await tokenRw.get(lookupKey);
          if (!token || token.status === 'refresh_error') {
            throw new Error('Concurrent access token refresh operation failed');
          }
        } catch (e) {
          return reject(new Error(`Error waiting for access token refresh: ${e.message}`));
        }
        if (token.status === 'authenticated') {
          return resolve(token);
        }
        let result;
        try {
          result = await this.waitForRefreshedAccessToken(
            ctx,
            lookupKey,
            count - 1,
            Math.floor(backoff * this.cfg.refreshBackoffIncrement),
            tokenRw
          );
        } catch (e) {
          return reject(e);
        }
        return resolve(result);
      }, backoff);
    });
  }

  public getStorageIdForVendorUser(id: any) {
    return `id/${encodeURIComponent(id)}`;
  }
}

export { OAuthEngine, IOAuthConfig, IOAuthToken };
