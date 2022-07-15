import superagent from 'superagent';
import { Connector, Internal } from '@fusebit-int/framework';
import { TokenClient, TokenSessionClient, TokenIdentityClient } from '@fusebit-int/oauth-connector';
import { Service } from './Service';
import { schema, uischema } from './configure';

const SERVICE_NAME = 'BambooHR';

// Configuration section name used to add extra configuration elements via this.addConfigurationElement
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

class ServiceConnector extends Connector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected createSessionClient(ctx: Connector.Types.Context): TokenSessionClient<any> {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new TokenSessionClient<string>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/session`,
      accessToken: ctx.state.params.functionAccessToken,
      createTags: async (token: any): Promise<any> => {
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
      validateToken: (token: string) => {
        if (token) {
          return;
        }

        throw new Error('Missing private key');
      },
    });
  }

  protected createIdentityClient(ctx: Connector.Types.Context): TokenIdentityClient<any> {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new TokenIdentityClient<any>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/identity`,
      accessToken: ctx.state.params.functionAccessToken,
    });
  }

  protected async ensureAccessToken(ctx: Internal.Types.Context, lookupKey: string): Promise<string> {
    const tokenClient: TokenClient<string> = ctx.state.tokenClient;
    const token: string | undefined = await tokenClient.get(lookupKey);

    if (!token) {
      ctx.throw(404);
    }
    return token;
  }

  protected sanitizeCredentials = (token: any) => {
    return {
      api_key: token.apiKey,
      company_domain: token.companyDomain,
    };
  };

  public constructor() {
    super();

    const Joi = this.middleware.validate.joi;
    // Override the authorize endpoint to render a Form requiring an API Key
    this.router.get('/api/authorize', async (ctx: Connector.Types.Context) => {
      const [form, contentType] = Internal.Form({
        schema,
        uiSchema: uischema,
        dialogTitle: 'Authorize BambooHR Access',
        submitUrl: 'form/api-key',
        state: {
          session: ctx.query.session,
        },
        data: undefined,
        cancelUrl: '',
        windowTitle: 'Authorize BambooHR Access',
      });
      ctx.body = form;
      ctx.header['Content-Type'] = contentType;
    });

    this.router.post('/api/form/api-key', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      const tokenClient = (ctx.state.tokenClient = this.createSessionClient(ctx));
      const formPayload = JSON.parse(ctx.req.body.payload);
      const { apiKey, companyDomain } = formPayload.payload;

      if (!apiKey || !companyDomain) {
        ctx.throw(400, 'Missing required fields');
      }

      const { session } = formPayload.state;
      await superagent
        .put(`${ctx.state.params.baseUrl}/session/${session}`)
        .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
        .send({ output: formPayload.payload });

      await tokenClient.put({ apiKey, companyDomain } as unknown, session);
      return ctx.redirect(`${ctx.state.params.baseUrl}/session/${session}/callback`);
    });

    this.router.get(
      '/api/session/:lookupKey/token',
      this.middleware.authorizeUser('connector:execute'),
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

    this.router.get(
      '/api/:lookupKey/health',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.state.tokenClient = this.createIdentityClient(ctx);
        await this.ensureAccessToken(ctx, ctx.params.lookupKey);
        ctx.status = 200;
      }
    );

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.schema = schema;
      ctx.body.uischema = uischema;
    });

    // Webhook management
    this.router.post(
      '/api/webhook',
      this.middleware.validate({
        body: Joi.object({
          webhookId: Joi.string().required(),
          id: Joi.string().required(),
          privateKey: Joi.string().required(),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.registerWebhook(ctx);
      }
    );

    this.router.get(
      '/api/webhook/:id/storage',
      this.middleware.validate({
        params: Joi.object({
          id: Joi.number().required(),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.getFusebitWebhook(ctx, ctx.params.id);
      }
    );

    this.router.delete(
      '/api/webhook/:id',
      this.middleware.validate({
        params: Joi.object({
          id: Joi.number().required(),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.deleteWebhook(ctx);
      }
    );

    this.router.post('/api/fusebit/webhook/event/:webhookId/:eventType', async (ctx: Connector.Types.Context) => {
      await this.service.handleWebhookEvent(ctx);
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
