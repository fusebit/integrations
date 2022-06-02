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

  public getStorageMailchimpWebhookKey = (webhookId: string) => {
    return `webhook/mailchimp/${webhookId}`;
  };

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const { webhookId, secret, id } = ctx.req.body;
    const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
    if (webhookStorage) {
      return (ctx.status = 409);
    }
    const createdTime = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { secret, createdTime, id } });
    await this.utilities.setData(ctx, this.getStorageMailchimpWebhookKey(id), { data: { webhookId } });
    return { webhookId, createdTime };
  };

  public updateWebhook = async (ctx: Connector.Types.Context) => {
    const { id } = ctx.params;
    const { secret } = ctx.req.body;
    const webhookStorage = await this.getMailchimpWebhook(ctx, id);
    if (!webhookStorage) {
      return (ctx.status = 404);
    }
    const { webhookId } = webhookStorage.data;
    const lastUpdate = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { secret, lastUpdate } });
    return { id, lastUpdate };
  };

  public deleteWebhook = async (ctx: Connector.Types.Context) => {
    const { id } = ctx.params;
    const webhookStorage = await this.getMailchimpWebhook(ctx, id);
    if (!webhookStorage) {
      return (ctx.status = 404);
    }
    const { webhookId } = webhookStorage.data;
    await this.utilities.deleteData(ctx, this.getStorageKey(webhookId));
    await this.utilities.deleteData(ctx, this.getStorageMailchimpWebhookKey(id));
    return { id };
  };

  private getFusebitWebhook = async (ctx: Connector.Types.Context, webhookId: string) => {
    return this.utilities.getData(ctx, this.getStorageKey(webhookId));
  };

  private getMailchimpWebhook = async (ctx: Connector.Types.Context, webhookId: string) => {
    return this.utilities.getData(ctx, this.getStorageMailchimpWebhookKey(webhookId));
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
    const webhookData = await this.getFusebitWebhook(ctx, webhookId);

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
