import { Connector, Internal } from '@fusebit-int/framework';
import { OAuthEngine, IOAuthConfig } from './OAuthEngine';

import * as ConfigurationUI from './configure';
import { IOAuthToken, ITags } from './OAuthTypes';

type MiddlewareAdjustUrlConfiguration = (
  defaultTokenUrl: string,
  defaultAuthorizationUrl: string,
  proxyKey?: string
) => Connector.Types.Handler;

class OAuthConnector<S extends Connector.Types.Service = Connector.Service> extends Connector<S> {
  static middleware: { adjustUrlConfiguration: MiddlewareAdjustUrlConfiguration };

  protected sanitizeCredentials(credentials: { refresh_token: string }): object {
    const result = { ...credentials };
    delete result.refresh_token;
    return result;
  }

  protected async onSessionError(ctx: Connector.Types.Context, error: { error: string; errorDescription?: string }) {
    await ctx.state.tokenClient.error({ ...error }, ctx.query.state);
  }

  protected adjustUrlConfiguration(
    defaultTokenUrl: string,
    defaultAuthorizationUrl: string,
    proxyKey?: string,
    dynamicAuthorizationFields?: string[]
  ) {
    return async (ctx: Connector.Types.Context, next: Connector.Types.Next): ReturnType<Connector.Types.Next> => {
      const { config: cfg } = ctx.state.manager;

      if (dynamicAuthorizationFields) {
        dynamicAuthorizationFields.forEach((field) => {
          defaultAuthorizationUrl = defaultAuthorizationUrl.replace(/{{([^}]*)}}/g, (r, k) => cfg.configuration[k]);
        });
      }

      cfg.configuration.constants = {
        urls: {
          production: {
            tokenUrl: defaultTokenUrl,
            authorizationUrl: defaultAuthorizationUrl,
          },
          ...(proxyKey
            ? {
                proxy: {
                  tokenUrl: `${ctx.state.params.baseUrl}/proxy/${proxyKey}/oauth/token`,
                  authorizationUrl: `${ctx.state.params.baseUrl}/proxy/${proxyKey}/oauth/authorize`,
                },
              }
            : {}),
          webhookUrl: `${ctx.state.params.baseUrl}/api/fusebit/webhook/event`,
          callbackUrl: `${ctx.state.params.baseUrl}/api/callback`,
        },
      };

      // Allow for override of the callback url.
      cfg.configuration.callbackUrl = cfg.configuration.callbackUrl || cfg.configuration.constants.urls.callbackUrl;

      // Make sure there's sensible defaults for the tokenUrl and authorizationUrl, but still allow them to be
      // overwritten if necessary.
      if (cfg.configuration.mode?.useProduction) {
        cfg.configuration.tokenUrl = cfg.configuration.tokenUrl || cfg.configuration.constants.urls.production.tokenUrl;
        cfg.configuration.authorizationUrl =
          cfg.configuration.authorizationUrl || cfg.configuration.constants.urls.production.authorizationUrl;
      } else if (proxyKey) {
        cfg.configuration.tokenUrl = cfg.configuration.tokenUrl || cfg.configuration.constants.urls.proxy.tokenUrl;
        cfg.configuration.authorizationUrl =
          cfg.configuration.authorizationUrl || cfg.configuration.constants.urls.proxy.authorizationUrl;
      }

      return next();
    };
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration('http://fusebit.io/token', 'http://fusebit.io/authorize', 'oauth');
  }

  protected readonly OAuthEngine = OAuthEngine;

  protected createEngine(ctx: Connector.Types.Context): OAuthEngine {
    return ctx.state.engine || new this.OAuthEngine(ctx.state.manager.config.configuration as IOAuthConfig);
  }

  /**
   *
   * @param ctx Connector context
   * @param configurationSection The section to configure (i.e Fusebit Connector Configuration)
   * @param propertyScope A JSON schema reference value
   * @param format How to display the control (i.e string, radio, password)
   */
  protected addConfigurationElement(
    ctx: Connector.Types.Context,
    configurationSection: string,
    propertyScope: string,
    format = 'string'
  ): void {
    const element = ctx.body.uischema.elements.find(
      (element: { label: string }) => element.label == configurationSection
    );
    if (element) {
      const newControl = {
        type: 'Control',
        scope: `#/properties/${propertyScope}`,
        options: {
          format,
        },
      };
      const oddRow = element.elements[0].elements.find(
        (rowElement: { elements: string | any[] }) => rowElement.elements.length !== 3
      );
      if (oddRow) {
        oddRow?.elements.push(newControl);
      } else {
        element.elements[0].elements.push({ type: 'VerticalLayout', elements: [newControl] });
      }
    } else {
      ctx.body = ctx.throw(`Invalid configuration section ${configurationSection}`);
    }
  }

  protected createIdentityClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenIdentityClient<IOAuthToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/identity`,
      accessToken: ctx.state.params.functionAccessToken,
    });
  }

  protected createSessionClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenSessionClient<IOAuthToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/session`,
      accessToken: ctx.state.params.functionAccessToken,
      createTags: async (token: IOAuthToken): Promise<ITags | undefined> => {
        const webhookIds = await this.service.getWebhookTokenId(ctx, token);
        const result: ITags = {};
        if (webhookIds) {
          if (Array.isArray(webhookIds)) {
            webhookIds.forEach((webhookId) => {
              result[webhookId] = null;
            });
          } else {
            result[webhookIds] = null;
          }
        }
        return result;
      },
      validateToken: async (token: IOAuthToken) => {
        if (token.access_token || token.refresh_token) {
          return;
        }

        const error = (token as { error?: string }).error;
        const errorMessageString = error ? `"${error}". ` : '';
        throw new Error(
          `${errorMessageString}Access token and Refresh token are both missing on object: ${JSON.stringify(
            Object.keys(token)
          )}`
        );
      },
    });
  }

  constructor() {
    super();

    // Adjust the configuration
    this.router.use(this.addUrlConfigurationAdjustment());

    // Adjust the configuration and create an engine to manipulate the OAuth state
    this.router.use(async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      ctx.state.engine = this.createEngine(ctx);
      ctx.state.engine.setMountUrl(ctx.state.params.baseUrl);

      return next();
    });

    // Internal Endpoints
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

        // Remove some default values so that they don't get accidentally persisted through UI configuration
        // events.
        const constUrls = ctx.state.manager.config.configuration.constants.urls;
        if (
          ctx.body.data.tokenUrl == constUrls.production.tokenUrl ||
          ctx.body.data.tokenUrl == constUrls.proxy?.tokenUrl
        ) {
          delete ctx.body.data.tokenUrl;
        }
        if (
          ctx.body.data.authorizationUrl == constUrls.production.authorizationUrl ||
          ctx.body.data.authorizationUrl == constUrls.proxy?.authorizationUrl
        ) {
          delete ctx.body.data.authorizationUrl;
        }
        return next();
      }
    );

    this.router.get(
      '/api/:lookupKey/health',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        if (!(await ctx.state.engine.ensureAccessToken(ctx, ctx.params.lookupKey))) {
          ctx.throw(404);
        }
        ctx.status = 200;
      }
    );

    this.router.get(
      '/api/session/:lookupKey/token',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        ctx.state.tokenClient = this.createSessionClient(ctx);
        try {
          ctx.body = this.sanitizeCredentials(await ctx.state.engine.ensureAccessToken(ctx, ctx.params.lookupKey));
        } catch (error) {
          ctx.throw(500, error.message);
        }
        if (!ctx.body) {
          ctx.throw(404);
        }

        return next();
      }
    );

    this.router.get(
      '/api/:lookupKey/token',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        try {
          ctx.body = this.sanitizeCredentials(await ctx.state.engine.ensureAccessToken(ctx, ctx.params.lookupKey));
        } catch (error) {
          ctx.throw(500, error.message);
        }
        if (!ctx.body) {
          ctx.throw(404);
        }

        return next();
      }
    );

    this.router.delete(
      '/api/:lookupKey',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        ctx.body = await ctx.state.engine.deleteUser(ctx, ctx.params.lookupKey);
      }
    );

    // OAuth Flow Endpoints
    this.router.get('/api/authorize', async (ctx: Connector.Types.Context) => {
      ctx.redirect(await ctx.state.engine.getAuthorizationUrl(ctx));
    });

    this.router.get('/api/callback', async (ctx: Connector.Types.Context) => {
      ctx.state.tokenClient = this.createSessionClient(ctx);
      const state = ctx.query.state;

      if (!state) {
        ctx.throw(400, 'Missing state');
      }

      if (ctx.query.error) {
        // The OAuth exchange has errored out - send back to callback and pass those parameters along.
        await this.onSessionError(ctx, {
          error: ctx.query.error,
          errorDescription: ctx.query.error_description || ctx.query.errorDescription,
        });
        return ctx.state.engine.redirectToCallback(ctx);
      }

      const code = ctx.query.code;

      if (!code) {
        await this.onSessionError(ctx, { error: 'Missing code query parameter from OAuth server' });
        return ctx.state.engine.redirectToCallback(ctx);
      }

      try {
        await ctx.state.engine.convertAccessCodeToToken(ctx, state, code);
      } catch (e) {
        await this.onSessionError(ctx, { error: `Conversion error: ${e.response?.text} - ${e.stack}` });
      }
      return ctx.state.engine.redirectToCallback(ctx);
    });
  }
}

const connector = new OAuthConnector();

export default connector;
export { OAuthConnector };
