import { Connector, Internal } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';
import { schema, uischema } from './configure';

const TOKEN_URL = 'https://login.microsoftonline.com/{{tenant}}/oauth2/v2.0/token';
const AUTHORIZATION_URL = 'https://login.microsoftonline.com/{{tenant}}/oauth2/v2.0/authorize';
const REVOCATION_URL = 'https://graph.microsoft.com/v1.0/me/revokeSignInSessions';
const SERVICE_NAME = 'Microsoft Dynamics';
// Configuration section name used to add extra configuration elements via this.addConfigurationElement
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';
const REQUIRED_SCOPES = ['offline_access'];

class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  protected async runExtraConfiguration(ctx: Connector.Types.Context, token: any) {
    await this.service.configure(ctx, token);
  }

  protected async onAuthorize(ctx: Connector.Types.Context) {
    const [form, contentType] = Internal.Form({
      schema,
      uiSchema: uischema,
      dialogTitle: 'Authorize application to connect to your Microsoft Dynamics Configuration',
      submitUrl: 'form/configure-organization',
      state: {
        session: ctx.query.session,
      },
      data: {},
      cancelUrl: `${ctx.state.params.baseUrl}/api/session/${ctx.query.session}/cancel`,
      windowTitle: 'Configure Integration',
    });
    ctx.body = form;
    ctx.header['Content-Type'] = contentType;
  }

  public constructor() {
    super();
    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Microsoft Dynamics Configuration';

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'tenant');

      // Make sure offline_access and other required scopes (if any) are present
      if (!ctx.body.data.configuration) {
        ctx.body.data.configuration = { scope: '' };
      }

      ctx.body.data.configuration.scope = [
        ...new Set([...ctx.body.data.configuration.scope.split(' ')].concat(REQUIRED_SCOPES)),
      ].join(' ');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.tenant = {
        title: `Tenant from your ${SERVICE_NAME} App`,
        type: 'string',
      };
    });

    const Joi = this.middleware.validate.joi;

    // Display configuration screen to specify a Microsoft Dynamics Organization.
    this.router.post(
      '/api/form/configure-organization',
      this.middleware.validate({
        body: Joi.object({
          payload: Joi.string().required(),
        }),
      }),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        const { payload, state } = JSON.parse(ctx.req.body.payload);
        const schema = Joi.object({
          state: {
            session: Joi.string().required(),
          },
          payload: Joi.object({
            organization: Joi.string().required(),
          }),
        });

        const { error } = schema.validate({
          payload,
          state,
        });
        if (error) {
          return ctx.throw(error);
        }
        ctx.query.session = state.session;
        const authorizationUrl = await ctx.state.engine.getAuthorizationUrl(ctx);
        const url = new URL(authorizationUrl);
        const scope = [
          ...new Set([
            ...REQUIRED_SCOPES,
            ctx.state.manager.config.configuration.scope || [],
            `https://${payload.organization}.api.crm.dynamics.com/user_impersonation`,
          ]),
        ].join(' ');

        url.searchParams.set('scope', scope);
        ctx.redirect(url.toString());
      }
    );

    this.router.post('/api/session/:session/cancel', async (ctx) => {
      ctx.body =
        'The process has been canceled; please start over to authorize access to your Microsoft Dynamics account.';
    });

    // Webhook management
    this.router.delete(
      '/api/webhook/:organizationId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.deleteWebhook(ctx, ctx.params.organizationId);
      }
    );

    this.router.patch(
      '/api/webhook/:organizationId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.updateWebhook(ctx, ctx.params.organizationId);
      }
    );

    this.router.get(
      '/api/webhook/:organizationId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.getWebhook(ctx, ctx.params.organizationId);
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
