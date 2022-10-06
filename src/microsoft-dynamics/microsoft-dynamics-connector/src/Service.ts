import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';
import { randomBytes, timingSafeEqual } from 'crypto';

class Service extends OAuthConnector.Service {
  private getWebhookStorage = async (ctx: Connector.Types.Context, organizationId: string) => {
    return this.utilities.getData(ctx, this.getStorageKey(organizationId));
  };

  private async getOrganizationInfo(token: any) {
    // Replace the Dynamics API Permission to get the server root
    const serverUrl = `${token.scope.replace('/user_impersonation', '')}/api/data/v9.2/WhoAmI`;
    const instanceResponse = await superagent
      .get(serverUrl)
      .set('Authorization', `Bearer ${token.access_token}`)
      .set('Accept', 'application/json');
    return instanceResponse.body;
  }

  public updateWebhook = async (ctx: Connector.Types.Context, organizationId: string) => {
    const secret = randomBytes(16).toString('hex');
    const lastUpdate = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(organizationId), { data: { secret, lastUpdate } });
    return await this.getWebhook(ctx, organizationId);
  };

  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [{ ...ctx.req.body }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return `organization/${event.OrganizationId}`;
  }

  public async configure(ctx: Connector.Types.Context, token: any) {
    // Generate a new Webhook secret associated to the specific organization.
    const { OrganizationId } = await this.getOrganizationInfo(token);
    const webhookStorage = await this.getWebhookStorage(ctx, OrganizationId);

    if (!webhookStorage) {
      const secret = randomBytes(16).toString('hex');
      const createdTime = Date.now();
      await this.utilities.setData(ctx, this.getStorageKey(OrganizationId), { data: { secret, createdTime } });
    }
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    // Webhook Validation for Microsoft Dynamics isn't sophisticated, for now, we expect
    // a secret key coming from one of the following mechanisms:
    // HttpHeader, WebhookKey, HttpQueryString
    const secret = ctx.query.secret || ctx.query.code || ctx.headers['secret'];
    const organizationId = ctx.req.body.OrganizationId;

    if (!secret || !ctx.req.body.OrganizationId) {
      return false;
    }
    const webhookStorage = await this.getWebhookStorage(ctx, organizationId);

    if (!webhookStorage?.data.secret) {
      return false;
    }

    const requestSecretBuffer = Buffer.from(secret, 'utf8');
    const storedSecretBuffer = Buffer.from(webhookStorage.data.secret, 'utf8');
    return timingSafeEqual(requestSecretBuffer, storedSecretBuffer);
  }

  public getStorageKey = (organizationId: string) => {
    return `webhook/ms-dynamics/${organizationId}`;
  };

  public getWebhook = async (ctx: Connector.Types.Context, organizationId: string) => {
    const webhookStorage = await this.getWebhookStorage(ctx, organizationId);
    if (!webhookStorage) {
      return (ctx.status = 404);
    }
    return webhookStorage.data;
  };

  public deleteWebhook = async (ctx: Connector.Types.Context) => {
    const { organizationId } = ctx.params;
    await this.utilities.deleteData(ctx, this.getStorageKey(organizationId));
  };

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const { OrganizationId, UserId } = await this.getOrganizationInfo(token);
    return [`organization/${OrganizationId}`, `user/${UserId}`];
  }

  public getWebhookEventType(event: any): string {
    return `${event.PrimaryEntityName}:${event.MessageName}`.toLowerCase();
  }
}

export { Service };
