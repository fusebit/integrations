import { Connector } from '@fusebit-int/framework';
import { OAuthEngine, IOAuthConfig } from './OAuthEngine';

import IdentityClient from './IdentityClient';

import * as ConfigurationUI from './configure';
import { IOAuthToken, ITags } from './OAuthTypes';

type MiddlewareAdjustUrlConfiguration = (
  defaultTokenUrl: string,
  defaultAuthorizationUrl: string,
  proxyKey?: string
) => Connector.Types.Handler;

class OAuthConnector<S extends Connector.Types.Service = Connector.Service> extends Connector<S> {
  static middleware: { adjustUrlConfiguration: MiddlewareAdjustUrlConfiguration };

  private validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL ${url}`);
    }
  }

  protected sanitizeCredentials(credentials: { refresh_token: string }): object {
    const result = { ...credentials };
    delete result.refresh_token;
    return result;
  }

  protected async onSessionError(ctx: Connector.Types.Context, error: { error: string; errorDescription?: string }) {
    await ctx.state.identityClient?.saveErrorToSession({ ...error }, ctx.query.state);
  }

  protected adjustUrlConfiguration(defaultTokenUrl: string, defaultAuthorizationUrl: string, proxyKey?: string) {
    this.validateUrl(defaultTokenUrl);
    this.validateUrl(defaultAuthorizationUrl);

    return async (ctx: Connector.Types.Context, next: Connector.Types.Next): ReturnType<Connector.Types.Next> => {
      const { config: cfg } = ctx.state.manager;

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

  constructor() {
    super();

    // Adjust the configuration
    this.router.use(this.addUrlConfigurationAdjustment());

    // Adjust the configuration and create an identityClient to manipulate the OAuth state
    this.router.use(async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      // Placeholder until event/cron are on their own routers
      if (ctx.method === 'EVENT') {
        return;
      }

      const createTags = async (token: IOAuthToken): Promise<ITags | undefined> => {
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
      };

      ctx.state.engine = this.createEngine(ctx);
      ctx.state.engine.setMountUrl(ctx.state.params.baseUrl);
      ctx.state.identityClient = new IdentityClient({
        createTags,
        accessToken: ctx.state.params.functionAccessToken,
        ...ctx.state.params,
      });

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
        try {
          ctx.body = this.sanitizeCredentials(
            await ctx.state.engine.ensureAccessToken(ctx, ctx.params.lookupKey, false)
          );
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
        ctx.body = await ctx.state.engine.deleteUser(ctx, ctx.params.lookupKey);
      }
    );

    // OAuth Flow Endpoints
    this.router.get('/api/authorize', async (ctx: Connector.Types.Context) => {
      ctx.redirect(await ctx.state.engine.getAuthorizationUrl(ctx));
    });

    this.router.get('/api/callback', async (ctx: Connector.Types.Context) => {
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
