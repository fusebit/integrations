import superagent from 'superagent';
import { Connector, Internal } from '@fusebit-int/framework';
import * as ConfigurationUI from './configure';

import { TokenClient, TokenSessionClient, TokenIdentityClient } from '@fusebit-int/oauth-connector';

interface ICcfToken {
  expires_at: number;
  access_token: string;
  client_id: string;
  client_secret: string;
  status?: string;
}

class CcfConnector extends Connector<Connector.Service> {
  protected readonly initialBackoff = 100;
  protected readonly maxWaitTime = 5000;
  protected readonly defaultExpirationInterval = 120000;
  protected readonly accessTokenExpirationBuffer = 120000;

  protected sanitizeCredentials = (token: ICcfToken) => ({
    expires_at: token.expires_at,
    access_token: token.access_token,
    client_id: token.client_id,
  });

  protected async waitForRefreshedAccessToken(ctx: Internal.Types.Context, lookupKey: string) {
    const startTime = Date.now();
    const tokenClient: TokenClient<ICcfToken> = ctx.state.tokenClient;

    let backoff = 0;
    let count = 1;
    do {
      const curToken = await ctx.state.tokenClient.get(lookupKey);
      if (curToken.data.status !== 'refreshing' || startTime + this.maxWaitTime > Date.now()) {
        return curToken;
      }

      // Wait a while to see if it's finished resolving.
      backoff = count * this.initialBackoff;
      count += 1;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    } while (true);
  }

  protected async refreshToken(ctx: Internal.Types.Context, lookupKey: string, token: ICcfToken) {
    const tokenClient: TokenClient<ICcfToken> = ctx.state.tokenClient;

    if (token.status === 'refreshing') {
      token = await this.waitForRefreshedAccessToken(ctx, lookupKey);
      if (token.status !== 'refreshing') {
        throw new Error('Error waiting for access token refresh');
      }
      return token;
    }

    if (!token.client_id || !token.client_secret) {
      throw new Error('Missing client_id and client_secret in token');
    }

    token.status = 'refreshing';
    await tokenClient.put(token, lookupKey);

    const url = new URL(ctx.state.manager.config.configuration.tokenUrl);
    url.searchParams.set('client_id', token.client_id);
    url.searchParams.set('client_secret', token.client_secret);

    const response = await superagent.get(url.toString());
    if (!response.body.access_token) {
      throw new Error('No access token in response');
    }

    delete token.status;
    token.access_token = response.body.access_token;
    token.expires_at = response.body.expires_at || this.defaultExpirationInterval + Date.now();

    await tokenClient.put(token, lookupKey);

    return token;
  }

  protected async ensureAccessToken(ctx: Internal.Types.Context, lookupKey: string) {
    const tokenClient: TokenClient<ICcfToken> = ctx.state.tokenClient;
    const token: ICcfToken | undefined = await tokenClient.get(lookupKey);

    if (!token) {
      ctx.throw(404);
    }

    const accessTokenExpirationBuffer = this.accessTokenExpirationBuffer || 0;
    if (
      token.access_token &&
      (token.expires_at === undefined || token.expires_at > Date.now() + accessTokenExpirationBuffer)
    ) {
      return token;
    }

    return await this.refreshToken(ctx, lookupKey, token);
  }

  protected createIdentityClient(ctx: Connector.Types.Context): TokenIdentityClient<ICcfToken> {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new TokenIdentityClient<ICcfToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/identity`,
      accessToken: ctx.state.params.functionAccessToken,
    });
  }

  protected createSessionClient(ctx: Connector.Types.Context): TokenSessionClient<ICcfToken> {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new TokenSessionClient<ICcfToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/session`,
      accessToken: ctx.state.params.functionAccessToken,
      createTags: () => ({}),
      validateToken: (token: ICcfToken) => {
        if (token.access_token || (token.client_id && token.client_secret)) {
          return;
        }

        const error = (token as { error?: string }).error;
        const errorMessageString = error ? `"${error}". ` : '';
        throw new Error(
          `${errorMessageString}Access token, client id, or client secret are missing on object: ${JSON.stringify(
            Object.keys(token)
          )}`
        );
      },
    });
  }

  constructor() {
    super();

    this.router.get(
      '/api/configure',
      this.middleware.authorizeUser('connector:put'),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        ctx.body = JSON.parse(
          JSON.stringify({
            data: {
              ...ctx.state.manager.config.configuration,
            },
            schema: ConfigurationUI.schema,
            uischema: ConfigurationUI.uischema,
          })
        );
        return next();
      }
    );

    this.router.get(
      '/api/:lookupKey/health',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        await this.ensureAccessToken(ctx, ctx.params.lookupKey);
        ctx.status = 200;
      }
    );

    const getToken = async (ctx: Connector.Types.Context) => {
      ctx.body = this.sanitizeCredentials(await this.ensureAccessToken(ctx, ctx.params.lookupKey));
    };

    this.router.get(
      '/api/session/:lookupKey/token',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createSessionClient(ctx);
        await getToken(ctx);
      }
    );

    this.router.get(
      '/api/:lookupKey/token',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        await getToken(ctx);
      }
    );

    this.router.delete(
      '/api/:lookupKey',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        ctx.body = await ctx.state.tokenClient.delete(ctx.params.lookupKey);
      }
    );

    // OAuth Flow Endpoints
    this.router.get('/api/authorize', async (ctx: Connector.Types.Context) => {
      const tokenClient = (ctx.state.tokenClient = this.createSessionClient(ctx));

      try {
        // Get the client_id and client_secret out of the input to the session
        const session = await tokenClient.get(ctx.query.session);
        if (!session.client_id || !session.client_secret) {
          throw new Error('Missing client_id and client_secret on session input');
        }

        // Store the client_id and client_secret in the proto token.
        await tokenClient.put(
          { client_id: session.client_id, client_secret: session.client_secret } as ICcfToken,
          ctx.query.session
        );

        // Create a new credential based on the details in the session.
        await this.ensureAccessToken(ctx, ctx.query.session);
      } catch (err) {
        console.log(err);
        tokenClient.error(err as any, ctx.query.session);
      }

      // Immediately send the user on to the next step in the session.
      ctx.redirect(`${ctx.state.params.baseUrl}/session/${ctx.query.session}/callback`);
    });
  }
}

const connector = new CcfConnector();

export default connector;
export { CcfConnector };
