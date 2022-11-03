import { Connector, Internal } from '@fusebit-int/framework';
import * as jose from 'jose';

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

    return new Internal.Provider.TokenSessionClient<Types.LoomToken>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/session`,
      accessToken: ctx.state.params.functionAccessToken,
      createTags: async (token: Types.LoomToken): Promise<ITags | undefined> => {
        const result: any = {};
        result[`loom/${token.publicAppId}`] = null;
        return result;
      },
      validateToken: (token: Types.LoomToken) => {
        if (token) {
          return;
        }
        throw new Error('Missing Private Key or Public App Id');
      },
    });
  }

  protected createIdentityClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenIdentityClient<Types.LoomToken>({
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

    // Override the authorize endpoint to render a Form requiring the Private Key and Public App Id.
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
          dialogTitle: 'Configure Loom recordSDK',
          submitUrl: 'form/private-key',
          state: {
            session: ctx.query.session,
          },
          data: existingSession?.privateKey ? { privateKey: '__PLACEHOLDER__' } : undefined,
          cancelUrl: `${ctx.state.params.baseUrl}/api/session/${ctx.query.session}/cancel`,
          windowTitle: 'Configure Loom recordSDK',
        });
        ctx.body = form;
        ctx.header['Content-Type'] = contentType;
      }
    );

    this.router.post('/api/session/:session/cancel', async (ctx) => {
      ctx.body =
        'The process has been canceled; please start over to authorize access to your Loom recordSDK application.';
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
            privateKey: Joi.string().required(),
            publicAppId: Joi.string().required(),
          }),
        });

        const { error } = schema.validate({
          payload,
          state,
        });
        if (error) {
          return ctx.throw(error);
        }

        let { privateKey } = payload;
        const { publicAppId } = payload;
        const { session } = state;
        const sessionInfo = await tokenClient.get(session);

        if (sessionInfo?.privateKey && privateKey === '__PLACEHOLDER__') {
          privateKey = sessionInfo.privateKey;
        }

        await tokenClient.put({ privateKey, publicAppId }, session);
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
      const { privateKey, publicAppId } = ctx.state.manager.config.configuration;

      const formattedKey = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');

      const importedPrivateKey = await jose.importPKCS8(formattedKey, 'RS256');
      const jws = await new jose.SignJWT({})
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setIssuer(publicAppId)
        .setExpirationTime('2m')
        .sign(importedPrivateKey);
      ctx.body = {
        jws,
      };
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
        await getToken(ctx);
        ctx.status = 200;
      }
    );

    this.router.get('/api/configure', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      // No current support for proxy credentials, as there's no demo account available for Loom recordSDK.
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
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector, Types };
