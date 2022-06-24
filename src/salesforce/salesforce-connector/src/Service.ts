import { Connector } from '@fusebit-int/framework';
import { OAuthConnector, IOAuthToken } from '@fusebit-int/oauth-connector';
import { createApexClass, createApexTestClass, createApexTrigger } from './apex';
import JWTBearerFow from './JWTBearerFlow';

import superagent from 'superagent';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import WebhookManager from './WebhookManager';

interface ISalesforceOAuthToken extends IOAuthToken {
  instance_url: string;
  id: string;
}

class Service extends OAuthConnector.Service {
  schemaBucket = 'webhook/schema';

  private getFusebitWebhook = async (ctx: Connector.Types.Context, webhookId: string) => {
    return this.utilities.getData(ctx, this.getStorageKey(webhookId));
  };

  public getStorageKey = (webhookId: string) => {
    return `webhook/${webhookId}`;
  };

  public getWebhookToken = async (ctx: Connector.Types.Context) => {
    const jwtBearerFlow = new JWTBearerFow(ctx);
    return await jwtBearerFlow.getAccessToken();
  };

  public listWebhooksSchema = async (ctx: Connector.Types.Context) => {
    const webhookSchema = await this.utilities.getData(ctx, this.schemaBucket);
    return webhookSchema ? webhookSchema.data : [];
  };

  public checkWebhookConfiguration = async (ctx: Connector.Types.Context) => {
    const jwtBearerFlow = new JWTBearerFow(ctx);
    const { access_token, instance_url } = await jwtBearerFlow.getAccessToken();
    const webhookManager = new WebhookManager({
      ctx,
      accessToken: access_token,
      instanceUrl: instance_url,
    });

    return await webhookManager.getWebhookConfiguration();
  };

  public getWebhookConfiguration = async (ctx: Connector.Types.Context) => {
    const webhookSchema = await this.utilities.getData(ctx, this.schemaBucket);
    return webhookSchema ? webhookSchema.data : [];
  };

  public createWebhook = async (ctx: Connector.Types.Context) => {
    const { entityId, events } = ctx.req.body;
    const jwtBearerFlow = new JWTBearerFow(ctx);
    const { access_token, instance_url } = await jwtBearerFlow.getAccessToken();
    const webhookManager = new WebhookManager({
      ctx,
      accessToken: access_token,
      instanceUrl: instance_url,
    });

    // Store the created trigger in the configuration storage so it can be replicated on tenants.
    const webhookSchema = await this.utilities.getData(ctx, this.schemaBucket);
    if (webhookSchema) {
      webhookSchema.data[entityId] = events;
    }

    await this.utilities.setData(ctx, this.schemaBucket, {
      data: webhookSchema ? webhookSchema.data : { [entityId]: events },
    });

    await webhookManager.createOrUpdateSalesforceTrigger({
      entityId,
      events,
    });

    return webhookSchema?.data;
  };

  public async enableWebhooksForDevelopment(ctx: Connector.Types.Context) {
    const jwtBearerFlow = new JWTBearerFow(ctx);
    const { access_token, instance_url } = await jwtBearerFlow.getAccessToken();
    const webhookManager = new WebhookManager({
      ctx,
      accessToken: access_token,
      instanceUrl: instance_url,
    });

    const webhookId = uuidv4();
    const { webhookSecret } = await webhookManager.prepareSalesforceInstanceForWebhooks(webhookId);
    // Get a webhook id associated to the development instance
    const webhookStorageKey = new URL(instance_url);
    const webhookStorage = await this.getFusebitWebhook(ctx, webhookStorageKey.hostname);
    if (!webhookStorage) {
      await this.utilities.setData(ctx, this.getStorageKey(webhookStorageKey.hostname), {
        data: { webhookSecret, webhookId },
      });
    }
  }

  public async configure(ctx: Connector.Types.Context, token: any) {
    const webhookManager = new WebhookManager({
      ctx,
      accessToken: token.access_token,
      instanceUrl: token.instance_url,
    });

    try {
      const webhookId = uuidv4();
      const { webhookSecret } = await webhookManager.prepareSalesforceInstanceForWebhooks(webhookId);
      const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
      if (!webhookStorage) {
        await this.utilities.setData(ctx, this.getStorageKey(webhookId), {
          data: { webhookSecret, webhookId },
        });
      }
    } catch (error) {
      ctx.throw(500, 'Something failed while enabling Salesforce Webhooks for your org');
    }
  }

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

    // TODO: Include Webhook Storage from development instance by using this.schemaBucket
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
