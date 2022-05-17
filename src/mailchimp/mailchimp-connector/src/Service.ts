import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

interface Event extends Record<string, any> {
  webhookId: string;
}

class Service extends OAuthConnector.Service {
  public isPingWebhook(ctx: Connector.Types.Context) {
    const userAgent = ctx.req.headers['user-agent'];
    return userAgent === 'MailChimp.com WebHook Validator';
  }

  public getStorageKey = (webhookId: string) => {
    return `webhook/${webhookId}`;
  };

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const { webhookId, secret } = ctx.req.body;
    const webhookStorage = await this.getWebhook(ctx, webhookId);
    if (webhookStorage) {
      return (ctx.status = 409);
    }
    const createdTime = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { secret, createdTime } });
    return { webhookId, createdTime };
  };

  public updateWebhook = async (ctx: Connector.Types.Context) => {
    const { webhookId } = ctx.params;
    const { secret } = ctx.req.body;
    const webhookStorage = await this.getWebhook(ctx, webhookId);
    if (!webhookStorage) {
      return (ctx.status = 404);
    }
    const lastUpdate = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { secret, lastUpdate } });
    return { webhookId, lastUpdate };
  };

  public deleteWebhook = async (ctx: Connector.Types.Context) => {
    const { webhookId } = ctx.params;
    const webhookStorage = await this.getWebhook(ctx, webhookId);
    if (!webhookStorage) {
      return (ctx.status = 404);
    }
    await this.utilities.deleteData(ctx, this.getStorageKey(webhookId));
    return { webhookId };
  };

  public getWebhook = async (ctx: Connector.Types.Context, webhookId: string) => {
    return this.utilities.getData(ctx, this.getStorageKey(webhookId));
  };

  public getEventsFromPayload(ctx: Connector.Types.Context) {
    return [{ ...ctx.req.body, webhookId: ctx.params.webhookId }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: Event) {
    return event.webhookId;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const { webhookId } = ctx.params;

    if (!webhookId) {
      return false;
    }

    const userAgent = ctx.req.headers['user-agent'];
    if (userAgent !== 'MailChimp') {
      return false;
    }

    // Mailchimp doesn't support Webhook secrets. Until that, the configured Webhook can send a secret via
    // Query string, this is optional, but a good practice to suggest to our customers.
    const { secret } = ctx.query;
    const webhookData = await this.utilities.getData(ctx, this.getStorageKey(webhookId));

    // If no webhook is stored, this is probably an illegitimate webhook call.
    if (!webhookData) {
      return false;
    }

    const { secret: storedSecret } = webhookData.data;

    // Secrets are optional, in case a secret is configured for the webhook, it should be validated.
    if (storedSecret) {
      return secret === storedSecret;
    }

    return true;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
