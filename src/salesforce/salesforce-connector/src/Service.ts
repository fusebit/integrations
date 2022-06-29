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

  private saveWebhookSecret = async (ctx: Connector.Types.Context, webhookId: string, webhookSecret: string) => {
    const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
    if (!webhookStorage) {
      await this.utilities.setData(ctx, this.getStorageKey(webhookId), {
        data: { webhookSecret, webhookId },
      });
    }
  };

  public getStorageKey = (webhookId: string) => {
    return `webhook/${webhookId}`;
  };

  public getWebhookToken = async (ctx: Connector.Types.Context) => {
    const jwtBearerFlow = new JWTBearerFow(ctx);
    return await jwtBearerFlow.getAccessToken();
  };

  // Overwritten
  public async configure(ctx: Connector.Types.Context, token: any) {
    try {
      const webhookManager = new WebhookManager({
        ctx,
        accessToken: token.access_token,
        instanceUrl: token.instance_url,
      });
      const webhookId = uuidv4();
      const { webhookSecret } = await webhookManager.prepareSalesforceInstanceForWebhooks(webhookId);
      await this.saveWebhookSecret(ctx, webhookId, webhookSecret);

      // Create triggers
      // Get triggers schema
      const webhookSchema = await this.utilities.getData(ctx, this.schemaBucket);
      const webhookSchemaData = webhookSchema?.data || [];

      // No webhooks configured? Skip. (Salesforce is not just Webhooks)
      if (!webhookSchemaData) {
        return;
      }

      const entities = Object.keys(webhookSchemaData);
      // Move to Promise.all
      for await (const entityId of entities) {
        await webhookManager.createOrUpdateSalesforceTrigger({
          entityId,
          events: webhookSchemaData[entityId],
        });
      }
    } catch (error) {
      // TODO: Log the error details
      console.error(error);
      ctx.throw(500, `Salesforce Webhooks creation failed for your instance ${token.instance_url}`);
    }
  }

  // Overwritten
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

  // Overwritten
  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
    return `instance_url/${event.instanceUrl}`;
  }

  // Overwritten
  public getEventsFromPayload(ctx: Connector.Types.Context) {
    return [{ ...ctx.req.body }];
  }

  // Overwritten
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

  // Overwritten
  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  // Overwritten
  public getWebhookEventType(event: any): string {
    return event.type;
  }

  // Webhooks authoring functionalities using a Salesforce development instance

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

    await webhookManager.createOrUpdateSalesforceTrigger({
      entityId,
      events,
    });

    // Store the created trigger in the configuration storage so it can be replicated on tenants.
    const webhookSchema = await this.utilities.getData(ctx, this.schemaBucket);
    if (webhookSchema) {
      webhookSchema.data[entityId] = events;
    }

    await this.utilities.setData(ctx, this.schemaBucket, {
      data: webhookSchema ? webhookSchema.data : { [entityId]: events },
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
    await this.saveWebhookSecret(ctx, webhookId, webhookSecret);
  }
}

export { Service };
