import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import { Service } from './Service';

const TOKEN_URL = 'https://app.asana.com/-/oauth_token';
const AUTHORIZATION_URL = 'https://app.asana.com/-/oauth_authorize';
const REVOCATION_URL = 'https://app.asana.com/-/oauth_revoke';
const SERVICE_NAME = 'Asana';

class ServiceConnector extends OAuthConnector {
  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL);
    // TODO: Proxy
    //return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: any) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Service Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Asana App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Asana App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Asana App';
    });

    const createWebhookSecretKey = (webhookId: string) => {
      return ['webhook', 'secret', webhookId].join('/');
    };
    const createWebhookCreateExpiryKey = (webhookId: string) => {
      return ['webhook', 'create_expiry', webhookId].join('/');
    };

    this.router.post('/api/fusebit_webhook_event/:webhookId', async (ctx: any) => {
      const webhookSecretKey = createWebhookSecretKey(ctx.params.webhookId);
      const webhookCreatedExpiryKey = createWebhookCreateExpiryKey(ctx.params.webhookId);
      ctx.fusebit = {
        ...ctx.fusebit,
        setWebhookSecret: (secret: string) => this.storage.setData(ctx, webhookSecretKey, { data: secret }),
        getWebhookSecret: () => this.storage.getData(ctx, webhookSecretKey),
        getWebhookCreateExpiry: () => this.storage.getData(ctx, webhookCreatedExpiryKey),
      };
      try {
        await this.service.handleWebhookEvent(ctx);
      } catch (e) {
        // This is a problem.  Prettier demands no typing, ts demands typing.
        ctx.throw((e as any).message);
      }
    });
    this.router.post('/api/fusebit_webhook_create/:webhookId', async (ctx: any) => {
      const createdTime = Date.now();
      const ttlSeconds = 60;
      const expiryTime = createdTime + ttlSeconds * 1000;
      await this.storage.setData(ctx, createWebhookCreateExpiryKey(ctx.params.webhookId), { data: expiryTime });
      ctx.body = { createdTime };
    });
  }

  // TODO: missing in hygen script? Wasn't auto created
  static Service = Service;
  protected createService() {
    return new ServiceConnector.Service();
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
