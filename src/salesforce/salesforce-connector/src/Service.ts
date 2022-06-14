import { Connector } from '@fusebit-int/framework';
import { OAuthConnector, IOAuthToken } from '@fusebit-int/oauth-connector';

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

  // Webhook configuration screen
  public async configure(ctx: Connector.Types.Context, token: any) {
    try {
      // No webhooks configured? Skip. (Salesforce is not just Webhooks)
      const { webhooks } = ctx.state.manager.config.configuration.webhookSchema;
      if (!webhooks) {
        return;
      }

      const webhookManager = new WebhookManager({
        ctx,
        accessToken: token.access_token,
        instanceUrl: token.instance_url,
      });
      const webhookId = uuidv4();
      const { webhookSecret } = await webhookManager.prepareSalesforceInstanceForWebhooks(webhookId);
      await this.saveWebhookSecret(ctx, webhookId, webhookSecret);

      // Create triggers
      const _mapActionsToArray = (actions: any) => {
        const actionsSchema: any = {
          afterInsert: 'after insert',
          afterUpdate: 'after update',
          afterDelete: 'after delete',
          afterUndelete: 'after undelete',
        };
        return Object.keys(actions).map((x: any) => actionsSchema[x]);
      };

      for await (const { entityId, actions } of webhooks) {
        await webhookManager.createOrUpdateSalesforceTrigger({
          entityId,
          events: _mapActionsToArray(actions),
        });
      }
    } catch (error) {
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

    // TODO: Add dates validation

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
}

export { Service };
