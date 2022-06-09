import superagent from 'superagent';
import crypto from 'crypto';

import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

/*
 * Outreach webhook support requires the connector to arbitrate requests to
 * https://api.outreach.io/api/v2/docs#webhook
 *
 * Add in the future using existing templates.
 */
class Service extends OAuthConnector.Service {
  // Get storageKey to put the signing secret.
  public getStorageKey = (webhookId: string) => {
    return `webhook/secret/${webhookId}`;
  };

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const { signingSecret, webhookId } = ctx.req.body;
    this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { signingSecret: signingSecret } });
  };

  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return ctx.req.body.data;
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return ctx.req?.url?.split('/').pop();
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    // Outreach webhook does not utilize a unified endpoint for webhooks.
    if (!ctx.params.webhookId) {
      return false;
    }
    const { webhookId } = ctx.params;
    const signingSecretItem = await this.utilities.getData(ctx, this.getStorageKey(webhookId));
    const signingSecret = signingSecretItem?.data?.signingSecret as string;
    const signature = ctx.req.headers['Outreach-Webhook-Signature'] as string;
    const sig = crypto
      .createHmac('sha256', Buffer.from(signingSecret))
      .update(JSON.stringify(ctx.req.body))
      .digest('hex');

    return signature === sig;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const data = await superagent
      .get('https://api.outreach.io/api/v2')
      .set('Authorization', `Bearer ${token.access_token}`)
      .set('Content-Type', 'application/vnd.api+json');

    return [`instance/${encodeURIComponent(data.body.meta.instanceUrl)}`, `user/${data.body.meta.user.id}`];
  }

  public getWebhookEventType(event: any): string {
    return event.meta.eventName;
  }
}

export { Service };
