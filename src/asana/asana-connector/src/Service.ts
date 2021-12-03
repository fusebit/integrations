import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface Event extends Record<string, any> {
  installId: string;
}

class Service extends OAuthConnector.Service {
  private createWebhookChallengeStorageKey = (webhookId: string) => {
    return ['webhook', 'create', webhookId].join('/');
  };
  private createWebhookSecretStorageKey = (webhookId: string) => {
    return ['webhook', 'secret', webhookId].join('/');
  };

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const webhookId = uuidv4();
    const storageKey = this.createWebhookChallengeStorageKey(webhookId);

    const createdTime = Date.now();
    const ttlSeconds = 60;
    const expires = new Date(createdTime + ttlSeconds * 1000).toISOString();

    await this.utilities.setData(ctx, storageKey, { expires, data: {} });
    return { createdTime, webhookId };
  };

  public getEventsFromPayload(ctx: Connector.Types.Context) {
    return ctx.req.body.events.map((event: Event) => {
      event.webhookId = ctx.params.webhookId;
      return event;
    });
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: Event) {
    return event.webhookId;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    if (ctx.req.headers['x-hook-secret']) {
      return true;
    }
    const webhookStorageId = this.createWebhookSecretStorageKey(ctx.params.webhookId);
    const storageData = await this.utilities.getData(ctx, webhookStorageId);
    const storageSecret = storageData?.data.secret;
    const requestBody = ctx.req.body;
    const rawBody = JSON.stringify(requestBody);
    const calculatedSignature = crypto.createHmac('sha256', storageSecret).update(rawBody).digest('hex');

    const signature = ctx.req.headers['x-hook-signature'] as string;

    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');
    const requestSignatureBuffer = Buffer.from(signature, 'utf8');
    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    const secret = ctx.req.headers['x-hook-secret'] as string;
    if (!secret) {
      return false;
    }

    const webhookChallengeStorageKey = this.createWebhookChallengeStorageKey(ctx.params.webhookId);
    const webhookStorageData = await this.utilities.getData(ctx, webhookChallengeStorageKey);

    if (!webhookStorageData) {
      ctx.throw('Webhook Registration Not Found', 404);
      return true;
    }

    const webhookSecretStorageKey = this.createWebhookSecretStorageKey(ctx.params.webhookId);
    const storageItem = { data: { secret } };
    await this.utilities.setData(ctx, webhookSecretStorageKey, storageItem);
    ctx.res.setHeader('x-hook-secret', secret);
    return true;
  }

  public getWebhookEventType(event: Event): string {
    return event.action;
  }
}

export { Service };
