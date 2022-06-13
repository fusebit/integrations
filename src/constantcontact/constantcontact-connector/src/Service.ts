import superagent from 'superagent';

import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    ctx.throw(500, 'Event location configuration missing. Required for webhook processing.');
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return '';
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    ctx.throw(500, 'Webhook Validation configuration missing. Required for webhook processing.');
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    ctx.throw(500, 'Webhook Challenge configuration missing. Required for webhook processing.');
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    try {
      const account = await superagent
        .get('https://api.cc.email/v3/account/summary')
        .set('Authorization', `Bearer ${token.access_token}`);
      return [
        `account/${account.body.encoded_account_id}`,
        `org/${encodeURIComponent(account.body.organization_name)}`,
      ];
    } catch (err) {
      throw err;
    }
  }

  public getWebhookEventType(event: any): string {
    return '';
  }
}

export { Service };
