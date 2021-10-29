import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import { Service } from './Service';
import { randomUUID } from 'crypto';

const TOKEN_URL = 'https://app.asana.com/-/oauth_token';
const AUTHORIZATION_URL = 'https://app.asana.com/-/oauth_authorize';
const REVOCATION_URL = 'https://app.asana.com/-/oauth_revoke';
const SERVICE_NAME = 'Asana';


class ServiceConnector extends OAuthConnector {

  static Service = Service;

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL);
  }
  protected setWebhookStorageData = async (ctx: Connector.Types.Context, storageKey: string, data: WebhookStorageData): Promise<void> => {
    await connector.storage.setData(ctx, storageKey, { data });
  };
  protected getWebhookStorageData = async (ctx: Connector.Types.Context, storageKey: string): Promise<WebhookStorageData> => {
    return (await connector.storage.getData(ctx, storageKey))?.data;
  };

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

    const createWebhookStorageKey = (webhookId: string) => {
      return ['webhook', 'secret', webhookId].join('/');
    };

    this.router.post('/api/fusebit_webhook_event/:webhookId', async (ctx: any) => {
      const webhookStorageKey = createWebhookStorageKey(ctx.params.webhookId);
      ctx.fusebit = {
        ...ctx.fusebit,
        setWebhookData: (data: WebhookStorageData) => this.setWebhookStorageData(ctx, webhookStorageKey, data),
        getWebhookData: () => this.getWebhookStorageData(ctx, webhookStorageKey)
      };
      try {
        await this.service.handleWebhookEvent(ctx);
      } catch (e) {
        // This is a problem.  Prettier demands no typing, ts demands typing.
        ctx.throw((e as any).message);
      }
    });
    // TODO: name convention?
    this.router.post('/api/fusebit_webhook_create', async (ctx: any) => {

      let existingEntry, webhookId, storageKey;
      do {
        webhookId = randomUUID();
        storageKey = createWebhookStorageKey(webhookId);
        existingEntry = await this.getWebhookStorageData(ctx, storageKey);
      } while (existingEntry);

      const createdTime = Date.now();
      const ttlSeconds = 60;
      const expiry = createdTime + ttlSeconds * 1000;

      await this.setWebhookStorageData(ctx, storageKey, {expiry});
      ctx.body = { createdTime, webhookId };
    });
  }

  protected createService() {
    return new ServiceConnector.Service();
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
