import crypto from 'crypto';
import superagent from 'superagent';
import { v4 as uuidv4 } from 'uuid';
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  public getSecretStorageKey = (webhookId: string) => {
    return `webhook/secret/${webhookId}`;
  };

  public getIdMappingStorageKey = (webhookId: string) => {
    return `webhook/mapping/${webhookId}`;
  };

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const { args, access_token } = ctx.req.body;
    const webhookId = uuidv4();
    const secret = uuidv4();
    const params = ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookUrl = `${baseUrl}/connector/${params.entityId}/api/fusebit/webhook/event/${webhookId}`;

    await this.utilities.setData(ctx, this.getSecretStorageKey(webhookId), { data: { secret } });

    const result = await superagent
      .post('https://api.pipedrive.com/v1/webhooks')
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        ...args,
        http_auth_user: webhookId,
        http_auth_password: secret,
        subscription_url: webhookUrl,
      });

    await this.utilities.setData(ctx, this.getIdMappingStorageKey(webhookId), { data: result.body.data.id });

    return {
      webhookId,
    };
  };

  public deleteWebhook = async (ctx: Connector.Types.Context) => {
    const { access_token } = ctx.req.body;
    // The webhookId here have already been translated to a Pipedrive webhookId
    const { webhookId } = ctx.params;
    const mapping = await this.utilities.getData(ctx, this.getIdMappingStorageKey(webhookId));
    await superagent
      .delete(`https://api.pipedrive.com/v1/webhooks/${mapping?.data.id}`)
      .set('Authorization', `Bearer ${access_token}`)
      .send({});

    await this.utilities.deleteData(ctx, this.getSecretStorageKey(webhookId));
    await this.utilities.deleteData(ctx, this.getIdMappingStorageKey(webhookId));
  };

  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [ctx.req.body];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return `company_domain/${event.meta.host.split('.')[0]}`;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    // Basic Auth? Seriously?
    const encodedRemote = ctx.req.headers['authorization']?.split(' ')[1];
    const rawRemote = Buffer.from(encodedRemote as string, 'base64');
    const rawLocal = await this.utilities.getData(ctx, this.getSecretStorageKey(ctx.params.webhookId));
    const correctLocal = ctx.params.webhookId + ':' + rawLocal?.data.secret;
    return crypto.timingSafeEqual(rawRemote, Buffer.from(correctLocal, 'utf-8'));
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const resp = await superagent
      .get('https://api.pipedrive.com/v1/users/me')
      .set('Authorization', `Bearer ${token.access_token}`)
      .send();
    return [
      `company_domain/${resp.body.data.company_domain}`,
      `company_country/${resp.body.data.company_country}`,
      `company_id/${resp.body.data.company_id}`,
    ];
  }

  public getWebhookEventType(event: any): string {
    return event.event;
  }
}

export { Service };
