import { Connector, Internal } from '@fusebit-int/framework';

import { Service } from './Service';
import { schema, uischema } from './configure';
import * as Types from './types';

interface ITags extends Record<string, string | null> {}

class ServiceConnector extends Connector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected createSessionClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenSessionClient<Types.ClearbitToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/session`,
      accessToken: ctx.state.params.functionAccessToken,
      createTags: async (token: Types.ClearbitToken): Promise<ITags | undefined> => {
        // TODO: Webhook support
        const result: any = {};
        return result;
      },
      validateToken: (token: Types.ClearbitToken) => {
        if (!token || !token.apiKey) {
          throw new Error("Missing Clearbit's API Key");
        }
      },
    });
  }

  protected createIdentityClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenIdentityClient<Types.ClearbitToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/identity`,
      accessToken: ctx.state.params.functionAccessToken,
    });
  }

  public constructor() {
    super();

    const Joi = this.middleware.validate.joi;
    const lookupKeySchema = Joi.string()
      .regex(/^idn-[a-f0-9]{32}$/)
      .required();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      // No current support for proxy credentials, as there's no demo account available for Clearbit.
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

    // Override the authorize endpoint to render a Form requiring the Private Key
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
          dialogTitle: 'Configure Clearbit API Key',
          submitUrl: 'form/private-key',
          state: {
            session: ctx.query.session,
          },
          data: existingSession?.apiKey ? { apiKey: '__PLACEHOLDER__' } : undefined,
          cancelUrl: `${ctx.state.params.baseUrl}/api/session/${ctx.query.session}/cancel`,
          windowTitle: 'Configure Clearbit API Key',
        });
        ctx.body = form;
        ctx.header['Content-Type'] = contentType;
      }
    );

    this.router.post('/api/session/:session/cancel', async (ctx) => {
      ctx.body = 'The process has been canceled; please start over to authorize access to your Clearbit application.';
    });

    this.router.post(
      '/api/form/private-key',
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
        const { session } = state;
        const sessionInfo = await tokenClient.get(session);

        if (sessionInfo?.apiKey && apiKey === '__PLACEHOLDER__') {
          apiKey = sessionInfo.apiKey;
        }

        await tokenClient.put({ apiKey }, session);
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
        const client = this.createSessionClient(ctx);
        const apiKey = await getToken(client, ctx.params.lookupKey);
        ctx.body = { access_token: apiKey };
      }
    );

    const getToken = async (tokenClient: Internal.Provider.BaseTokenClient<Types.ClearbitToken>, lookupKey: string) => {
      const { apiKey } = await tokenClient.get(lookupKey);
      return apiKey;
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
        const client = this.createIdentityClient(ctx);
        const apiKey = await getToken(client, ctx.params.lookupKey);
        ctx.body = { access_token: apiKey };
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
        const client = this.createIdentityClient(ctx);
        await getToken(client, ctx.params.lookupKey);
        ctx.status = 200;
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector, Types };
