import { Connector } from '@fusebit-int/framework';
import { OAuthConnector, IOAuthToken } from '@fusebit-int/oauth-connector';
import { createApexClass, createApexTestClass, createApexTrigger } from './apex';

import superagent from 'superagent';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface ISalesforceOAuthToken extends IOAuthToken {
  instance_url: string;
  id: string;
}

class Service extends OAuthConnector.Service {
  private getFusebitWebhook = async (ctx: Connector.Types.Context, webhookId: string) => {
    return this.utilities.getData(ctx, this.getStorageKey(webhookId));
  };

  public getStorageKey = (webhookId: string) => {
    return `webhook/${webhookId}`;
  };

  public createWebhookSecret = async (ctx: Connector.Types.Context) => {
    const { className, entityId, events } = ctx.req.body;
    const webhookSecret = uuidv4();
    const webhookId = uuidv4();
    const params = ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookEndpoint = `${baseUrl}/connector/${params.entityId}/api/fusebit/webhook/event`;

    const apexClass = await createApexClass(className, entityId.toLowerCase(), webhookSecret, webhookId);

    const apexTestClass = await createApexTestClass({
      testClassName: `${className}Test`,
      webhookClassName: className,
      entityId,
      webhookEndpoint,
    });

    const apexTrigger = await createApexTrigger({
      triggerName: `${className}Trigger`,
      className,
      entityId,
      webhookEndpoint,
      events,
    });

    const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
    if (webhookStorage) {
      return (ctx.status = 409);
    }
    const createdTime = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { webhookSecret, createdTime } });
    return { webhookId, createdTime, webhookSecret, apexClass, apexTestClass, apexTrigger };
  };

  // Convert an OAuth token into the key used to look up matching installs for a webhook.
  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const sfToken = token as ISalesforceOAuthToken;
    const user = await superagent.get(sfToken.id).set('Authorization', `Bearer ${sfToken.access_token}`);
    return [
      `instance_url/${encodeURIComponent(sfToken.instance_url)}`,
      `user_id/${user.body.user_id}`,
      `organization_id/${user.body.organization_id}`,
    ];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
    return `instance_url/${event.instanceUrl}`;
  }

  public getEventsFromPayload(ctx: Connector.Types.Context) {
    return [{ ...ctx.req.body }];
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const signature = ctx.req.headers['x-fusebit-salesforce-signature'] as string;
    const webhookId = ctx.req.headers['x-fusebit-salesforce-webhook-id'] as string;
    const userAgent = ctx.req.headers['user-agent'] as string;

    if (userAgent !== 'fusebit/salesforce' || !signature || !webhookId) {
      return false;
    }

    const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
    if (!webhookStorage) {
      return false;
    }
    const secret = webhookStorage.data.webhookSecret;
    const rawBody = JSON.stringify(ctx.req.body);

    const computedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    const calculatedSignatureBuffer = Buffer.from(computedSignature, 'utf8');
    const requestSignatureBuffer = Buffer.from(signature, 'utf8');
    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
