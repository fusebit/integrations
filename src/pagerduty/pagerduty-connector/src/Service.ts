import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';
import crypto from 'crypto';
class Service extends OAuthConnector.Service {
  // Get storageKey to put the signing secret.
  public getStorageKey = (webhookId: string) => {
    return `webhook/secret/${webhookId}`;
  };

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const { signingSecret, webhookId } = ctx.req.body;
    this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { signingSecret: signingSecret } });
  };

  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return event.event.agent.id;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context) {
    // PagerDuty webhook does not utilize a unified endpoint for webhooks.
    if (!ctx.params.webhookId) {
      return false;
    }
    const { webhookId } = ctx.params;
    const signingSecretItem = await this.utilities.getData(ctx, this.getStorageKey(webhookId));
    const signingSecret = signingSecretItem?.data?.signingSecret as string;
    const signatures = (ctx.req.headers['x-pagerduty-signature'] as string).split(',');
    signatures.map((sig) => sig.split('v1=')[1]);
    const sig = crypto
      .createHmac('sha256', Buffer.from(signingSecret))
      .update(JSON.stringify(ctx.req.body))
      .digest('hex');
    if (signatures.indexOf('v1=' + sig) > -1) {
      return true;
    }
    return false;
  }

  protected async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    // PagerDuty does not implement any sort of initialization challenge, always assume false.
    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const data = await superagent
      .get('https://api.pagerduty.com/users/me')
      .set('Authorization', `Bearer ${token.access_token}`)
      .set('Accept', 'application/vnd.pagerduty+json;version=2');
    return data.body.user.id;
  }

  protected getWebhookEventType(event: any): string {
    return event.event.event_type;
  }
}

export { Service };
