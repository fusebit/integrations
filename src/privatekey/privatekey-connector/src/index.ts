import { Connector, Internal } from '@fusebit-int/framework';
import { configure } from './configure';

interface ITags extends Record<string, string | null> {}

export interface ITokenSchema {
  [name: string]: string;
}

export interface IConfigurationFormOptions {
  dialogTitle: string;
  windowTitle: string;
}

export interface IConfigurationSchema {
  schema: any;
  uiSchema: any;
}

export abstract class PrivateKeyConnector<S extends Connector.Service = Connector.Service> extends Connector<S> {
  protected abstract getServiceName(): string;

  // Override as needed
  protected getKeyName(): string {
    return 'API Key';
  }

  // Override as needed
  protected getPrivateKeyFieldName(): string {
    return 'privateKey';
  }

  // Override as needed
  protected getConfigurationSchema(): IConfigurationSchema {
    return configure(this.getServiceName(), this.getKeyName(), this.getPrivateKeyFieldName());
  }

  // Override as needed
  protected async onCreateTags(ctx: Connector.Types.Context, token: ITokenSchema): Promise<ITags | undefined> {
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
  }

  // Override as needed
  protected onValidateToken(token: ITokenSchema): void {
    if (!token || !token[this.getPrivateKeyFieldName()]) {
      throw new Error(`Missing ${this.getServiceName()} ${this.getKeyName()}`);
    }
  }
  protected createSessionClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenSessionClient<ITokenSchema>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/session`,
      accessToken: ctx.state.params.functionAccessToken,
      createTags: async (token: ITokenSchema): Promise<ITags | undefined> => {
        return this.onCreateTags(ctx, token);
      },
      validateToken: (token: ITokenSchema) => {
        this.onValidateToken(token);
      },
    });
  }

  protected createIdentityClient(ctx: Connector.Types.Context) {
    const functionUrl = new URL(ctx.state.params.baseUrl);
    const baseUrl = `${functionUrl.protocol}//${functionUrl.host}/v2/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}/connector/${ctx.state.params.entityId}`;

    return new Internal.Provider.TokenIdentityClient<ITokenSchema>({
      accountId: ctx.state.params.accountId,
      subscriptionId: ctx.state.params.subscriptionId,
      baseUrl: `${baseUrl}/identity`,
      accessToken: ctx.state.params.functionAccessToken,
    });
  }

  protected async onConfigure(ctx: Connector.Types.Context, next: Connector.Types.Next) {
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
  }

  protected async renderAuthorizationForm(
    ctx: Connector.Types.Context,
    { dialogTitle, windowTitle }: IConfigurationFormOptions
  ): Promise<void> {
    const tokenClient = this.createSessionClient(ctx);
    // Get content for an existing session
    let existingSession = null;
    if (ctx.query.session) {
      existingSession = await tokenClient.get(ctx.query.session);
    }
    const { schema, uiSchema } = this.getConfigurationSchema();
    const privateKeyFieldName = this.getPrivateKeyFieldName();

    const [form, contentType] = Internal.Form({
      schema,
      uiSchema,
      dialogTitle,
      submitUrl: 'form/submit',
      state: {
        session: ctx.query.session,
      },
      data:
        existingSession && existingSession[privateKeyFieldName]
          ? { [privateKeyFieldName]: '__PLACEHOLDER__' }
          : undefined,
      cancelUrl: `${ctx.state.params.baseUrl}/api/session/${ctx.query.session}/cancel`,
      windowTitle,
    });
    ctx.body = form;
    ctx.header['Content-Type'] = contentType;
  }

  protected getPayloadSchema(): any {
    const Joi = this.middleware.validate.joi;
    return Joi.object({
      [this.getPrivateKeyFieldName()]: Joi.string().required(),
    });
  }

  protected async onSubmitForm(ctx: Connector.Types.Context): Promise<any> {
    const tokenClient = (ctx.state.tokenClient = this.createSessionClient(ctx));
    const { payload, state } = JSON.parse(ctx.req.body.payload);
    const Joi = this.middleware.validate.joi;
    const schema = Joi.object({
      state: {
        session: Joi.string().required(),
      },
      payload: this.getPayloadSchema(),
    });

    const { error } = schema.validate({
      payload,
      state,
    });
    if (error) {
      return ctx.throw(error);
    }

    const privateFieldName = this.getPrivateKeyFieldName();
    let privateKey = payload[privateFieldName];

    const payloadFields = Object.keys(payload).filter((field) => field !== privateFieldName);
    const payloadMapping = {};
    payloadFields.forEach((field: string) => ((payloadMapping as any)[field] = payload[field]));
    const { session } = state;
    const sessionInfo = (await tokenClient.get(session)) as ITokenSchema;

    if (sessionInfo && sessionInfo[privateFieldName] && privateKey === '__PLACEHOLDER__') {
      privateKey = sessionInfo[privateFieldName];
    }

    await tokenClient.put({ privateKey, ...payloadMapping }, session);
    ctx.redirect(`${ctx.state.params.baseUrl}/session/${session}/callback`);
  }

  protected onCancelAuthorization(ctx: Connector.Types.Context): void {
    ctx.body = `The process has been canceled; please start over to authorize access to your ${this.getServiceName()} application.`;
  }

  protected async getToken(tokenClient: Internal.Provider.BaseTokenClient<ITokenSchema>, lookupKey: string) {
    const token = await tokenClient.get(lookupKey);
    return token[this.getPrivateKeyFieldName()];
  }

  public constructor() {
    super();

    const Joi = this.middleware.validate.joi;
    const lookupKeySchema = Joi.string()
      .regex(/^idn-[a-f0-9]{32}$/)
      .required();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      await this.onConfigure(ctx, next);
    });

    this.router.post('/api/session/:session/cancel', async (ctx: Connector.Types.Context) => {
      await this.onCancelAuthorization(ctx);
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
        await this.renderAuthorizationForm(ctx, {
          dialogTitle: `Configure your ${this.getServiceName()} ${this.getKeyName()}`,
          windowTitle: `Configuring your ${this.getServiceName()} application`,
        });
      }
    );

    this.router.post(
      '/api/form/submit',
      this.middleware.validate({
        body: Joi.object({
          payload: Joi.string().required(),
        }),
      }),
      async (ctx: Connector.Types.Context) => {
        await this.onSubmitForm(ctx);
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
        const apiKey = await this.getToken(client, ctx.params.lookupKey);
        ctx.body = { access_token: apiKey };
      }
    );

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
        const token = await this.getToken(client, ctx.params.lookupKey);
        ctx.body = { access_token: token };
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
        await this.getToken(client, ctx.params.lookupKey);
        ctx.status = 200;
      }
    );
  }
}
