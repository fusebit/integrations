import superagent from 'superagent';
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  public getStorageKey = (webhookId: string) => {
    return `webhook/secret/${webhookId}`;
  };

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const { password, webhookId } = ctx.req.body;
    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { password } });
  };

  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [ctx.req.body];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return event.meta.host.split('.')[0];
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    // Basic Auth? Seriously?
    const encodedRemote = ctx.req.headers['authorization']?.split(' ')[1];
    const rawRemote = Buffer.from(encodedRemote as string, 'base64').toString('utf-8');
    const rawLocal = await this.utilities.getData(ctx, this.getStorageKey(ctx.params.webhookId));
    const correctLocal = ctx.params.webhookId + ':' + rawLocal?.data.password;
    return rawRemote === correctLocal;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const resp = await superagent
      .get('https://api.pipedrive.com/v1/users/me')
      .set('Authorization', `Bearer ${token.access_token}`)
      .send();
    return resp.body.data.company_domain;
  }

  public getWebhookEventType(event: any): string {
    return event.event;
  }
}

export { Service };
