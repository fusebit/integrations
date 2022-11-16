import { Connector, Internal } from '@fusebit-int/framework';

import { Service } from './Service';
import { schema, uischema } from './configure';
import * as Types from './types';

const SERVICE_NAME = 'BambooHR';
// Configuration section name used to add extra configuration elements via this.addConfigurationElement
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

interface ITags extends Record<string, string | null> {}

class ServiceConnector extends Connector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected createSessionClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenSessionClient<Types.BambooHRToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/session`,
      accessToken: ctx.state.params.functionAccessToken,
      createTags: async (token: Types.BambooHRToken): Promise<ITags | undefined> => {
        const webhookIds = await this.service.getWebhookTokenId(ctx, token);
        const result: any = {};
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
      validateToken: (token: Types.BambooHRToken) => {
        if (token) {
          return;
        }

        throw new Error('Missing private key or Company domain');
      },
    });
  }

  protected createIdentityClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenIdentityClient<Types.BambooHRToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/identity`,
      accessToken: ctx.state.params.functionAccessToken,
    });
  }

  protected async ensureAccessToken(ctx: Internal.Types.Context, lookupKey: string): Promise<Types.BambooHRToken> {
    const tokenClient = ctx.state.tokenClient;
    const token: Types.BambooHRToken = await tokenClient.get(lookupKey);

    if (!token) {
      ctx.throw(404);
    }

    return token;
  }

  protected sanitizeCredentials = (token: any) => {
    return {
      apiKey: token.apiKey,
      companyDomain: token.companyDomain.includes('bamboohr.com')
        ? token.companyDomain
        : `${token.companyDomain}.bamboohr.com`,
    };
  };

  private async getCredentials(ctx: Connector.Types.Context) {
    ctx.state.tokenClient = this.createIdentityClient(ctx);
    return this.sanitizeCredentials(await this.ensureAccessToken(ctx, ctx.params.lookupKey));
  }

  public constructor() {
    super();

    const Joi = this.middleware.validate.joi;
    const lookupKeySchema = Joi.string()
      .regex(/^idn-[a-f0-9]{32}$/)
      .required();

    // Override the authorize endpoint to render a Form requiring an API Key
    this.router.get(
      '/api/authorize',
      this.middleware.validate({
        query: Joi.object({
          session: Joi.string().required(),
          redirect_uri: Joi.string().uri().required(),
        }),
      }),
      async (ctx: Connector.Types.Context) => {
        const tokenClient = (ctx.state.tokenClient = this.createSessionClient(ctx));
        // Get content for an existing session
        let existingSession = null;
        if (ctx.query.session) {
          existingSession = await tokenClient.get(ctx.query.session);
        }

        const [form, contentType] = Internal.Form({
          schema,
          uiSchema: uischema,
          dialogTitle: 'Authorize BambooHR Access',
          submitUrl: 'form/api-key',
          state: {
            session: ctx.query.session,
          },
          data: existingSession?.companyDomain
            ? { companyDomain: existingSession.companyDomain, apiKey: '__PLACEHOLDER__' }
            : undefined,
          cancelUrl: `${ctx.state.params.baseUrl}/api/session/${ctx.query.session}/cancel`,
          windowTitle: 'Authorize BambooHR Access',
        });
        ctx.body = form;
        ctx.header['Content-Type'] = contentType;
      }
    );

    this.router.post('/api/session/:session/cancel', async (ctx) => {
      ctx.body = 'The process has been canceled; please start over to authorize access to your BambooHR account.';
    });

    this.router.post(
      '/api/form/api-key',
      this.middleware.validate({
        body: Joi.object({
          payload: Joi.string().required(),
        }),
      }),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        const tokenClient = (ctx.state.tokenClient = this.createSessionClient(ctx));
        const { payload, state } = JSON.parse(ctx.req.body.payload);
        const schema = Joi.object({
          state: {
            session: Joi.string().required(),
          },
          payload: Joi.object({
            apiKey: Joi.string().required(),
            companyDomain: Joi.string()
              .pattern(
                /^([a-zA-Z0-9]([-a-zA-Z0-9]{0,61}[a-zA-Z0-9])?\.)?([a-zA-Z0-9]{1,2}([-a-zA-Z0-9]{0,252}[a-zA-Z0-9])?)(\.(\bbamboohr.com\b))?$/
              )
              .required(),
          }),
        });

        const { error } = schema.validate({
          payload,
          state,
        });
        if (error) {
          return ctx.throw(error);
        }

        let { apiKey } = payload;
        const { companyDomain } = payload;
        const { session } = state;
        const sessionInfo = await tokenClient.get(session);

        if (sessionInfo?.apiKey && apiKey === '__PLACEHOLDER__') {
          apiKey = sessionInfo.apiKey;
        }

        await tokenClient.put({ apiKey, companyDomain }, session);
        return ctx.redirect(`${ctx.state.params.baseUrl}/session/${session}/callback`);
      }
    );

    this.router.get(
      '/api/session/:lookupKey/token',
      this.middleware.authorizeUser('connector:execute'),
      this.middleware.validate({
        params: Joi.object({
          lookupKey: lookupKeySchema,
        }),
      }),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createSessionClient(ctx);
        await getToken(ctx);
      }
    );

    const getToken = async (ctx: Connector.Types.Context) => {
      ctx.body = this.sanitizeCredentials(await this.ensureAccessToken(ctx, ctx.params.lookupKey));
    };

    this.router.get(
      '/api/:lookupKey/token',
      this.middleware.validate({
        params: Joi.object({
          lookupKey: lookupKeySchema,
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        await getToken(ctx);
      }
    );

    this.router.delete(
      '/api/:lookupKey',
      this.middleware.validate({
        params: Joi.object({
          lookupKey: lookupKeySchema,
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        ctx.body = await ctx.state.tokenClient.delete(ctx.params.lookupKey);
      }
    );

    this.router.get(
      '/api/:lookupKey/health',
      this.middleware.validate({
        params: Joi.object({
          lookupKey: lookupKeySchema,
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        await this.ensureAccessToken(ctx, ctx.params.lookupKey);
        ctx.status = 200;
      }
    );

    this.router.get('/api/configure', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      // No current support for proxy credentials, as there's no demo account available for BambooHR. When
      // that changes, add the necessary random clientId and clientSecret logic back into the catalog.
      ctx.body = {
        schema: {
          properties: {
            useProduction: {
              options: {
                readonly: true,
              },
            },
          },
        },
      };

      return next();
    });

    const webhookSchema = Joi.object({
      apiKey: Joi.string().required(),
      companyDomain: Joi.string().required(),
      name: Joi.string().required(),
      monitorFields: Joi.array().items(Joi.string()).required().min(1),
      postFields: Joi.object().optional().min(1),
      frequency: Joi.object({
        hour: Joi.number().allow(null).min(0).max(23),
        minute: Joi.number().allow(null).min(0).max(59),
        day: Joi.number().allow(null).min(1).max(31),
        month: Joi.number().allow(null).min(1).max(12),
      })
        .optional()
        .min(1),
      limit: Joi.object({
        times: Joi.number(),
        seconds: Joi.number(),
      })
        .optional()
        .min(1),
    });

    // Webhook management
    this.router.post(
      '/api/webhook/:lookupKey',
      this.middleware.validate({
        params: Joi.object({
          lookupKey: lookupKeySchema,
        }),
        body: webhookSchema,
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.registerWebhook(ctx);
      }
    );

    this.router.put(
      '/api/webhook/:lookupKey/:id',
      this.middleware.validate({
        params: Joi.object({
          lookupKey: lookupKeySchema,
          id: Joi.number().required(),
        }),
        body: webhookSchema,
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.updateWebhook(ctx);
      }
    );

    this.router.delete(
      '/api/webhook/:lookupKey/:id',
      this.middleware.validate({
        params: Joi.object({
          id: Joi.number().required(),
          lookupKey: lookupKeySchema,
        }),
        body: Joi.object({
          apiKey: Joi.string().required(),
          companyDomain: Joi.string().required(),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.deleteWebhook(ctx);
      }
    );

    this.router.post(
      '/api/fusebit/webhook/event/:webhookId/action/:eventType',
      this.middleware.validate({
        params: Joi.object({
          webhookId: Joi.string().guid().required(),
          eventType: Joi.string().required(),
        }),
      }),
      async (ctx: Connector.Types.Context) => {
        await this.service.handleWebhookEvent(ctx);
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector, Types };
