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

  public createWebhook = async (ctx: Connector.Types.Context) => {
    const { entityId, events } = ctx.req.body;
    const webhookSecret = uuidv4();
    // Get Webhook Id from Storage
    const webhookId = uuidv4();
    const params = ctx.state.params;
    // We only need 1 Class for the Webhook representing the HTTP Request.
    const className = `Webhook_Sub_${params.subscriptionId}`;

    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookEndpoint = `${baseUrl}/connector/${params.entityId}/api/fusebit/webhook/event`;

    // const apexClass = await createApexClass(className, entityId.toLowerCase(), webhookSecret, webhookId);

    // const apexTestClass = await createApexTestClass({
    //   testClassName: `${className}Test`,
    //   webhookClassName: className,
    //   entityId,
    //   webhookEndpoint,
    // });

    // const apexTrigger = await createApexTrigger({
    //   triggerName: `${className}Trigger`,
    //   className,
    //   entityId,
    //   webhookEndpoint,
    //   events,
    // });

    // const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
    // if (webhookStorage) {
    //   return (ctx.status = 409);
    // }
    // const createdTime = Date.now();
    // await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { webhookSecret, createdTime } });
    // return { webhookId, createdTime, webhookSecret, apexClass, apexTestClass, apexTrigger };
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
      const createdTime = Date.now();
      await this.utilities.setData(ctx, this.getStorageKey(webhookStorageKey.hostname), {
        data: { webhookSecret, webhookId, createdTime },
      });
    }
  }

  public async addWebhook(ctx: Connector.Types.Context) {}

  public async configure(ctx: Connector.Types.Context, token: any) {
    const webhookManager = new WebhookManager({
      ctx,
      accessToken: token.access_token,
      instanceUrl: token.instance_url,
    });

    try {
      const { webhookId, webhookSecret } = await webhookManager.prepareSalesforceInstanceForWebhooks('');
    } catch (error) {
      console.log(error);
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
