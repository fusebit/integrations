import { Connector } from '@fusebit-int/framework';
import { IOAuthToken } from '@fusebit-int/oauth-connector';
import { randomBytes, timingSafeEqual } from 'crypto';

class Service extends Connector.Service {
  public getStorageKey = (organizationId: string) => {
    return `webhook/ms-dynamics/${organizationId}`;
  };

  private getWebhookStorage = async (ctx: Connector.Types.Context, organizationId: string) => {
    return this.utilities.getData(ctx, this.getStorageKey(organizationId));
  };

  public updateWebhookStorage = async (ctx: Connector.Types.Context, organizationId: string) => {
    const secret = randomBytes(16).toString('hex');
    const lastUpdate = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(ctx.params.organizationId), { data: { secret, lastUpdate } });
    return { secret, lastUpdate };
  };

  public updateWebhook = async (ctx: Connector.Types.Context) => {
    return this.updateWebhookStorage(ctx, ctx.params.organizationId);
  };

  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [{ ...ctx.req.body }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return `organization/${event.OrganizationId}`;
  }

  public async configure(ctx: Connector.Types.Context, token: IOAuthToken) {
    // Generate a new Webhook secret associated to the specific organization.
    const webhookStorage = await this.getWebhookStorage(ctx, token.params.organizationId);

    if (!webhookStorage) {
      await this.updateWebhookStorage(ctx, token.params.organizationId);
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

  public getWebhook = async (ctx: Connector.Types.Context) => {
    const webhookStorage = await this.getWebhookStorage(ctx, ctx.params.organizationId);
    if (!webhookStorage) {
      return (ctx.status = 404);
    }
    return webhookStorage.data;
  };

  public deleteWebhook = async (ctx: Connector.Types.Context) => {
    await this.utilities.deleteData(ctx, this.getStorageKey(ctx.params.organizationId));
  };

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: IOAuthToken): Promise<string | string[] | void> {
    return [`organization/${token.params.organizationId}`, `user/${token.params.userId}`];
  }

  public getWebhookEventType(event: any): string {
    return `${event.PrimaryEntityName}:${event.MessageName}`.toLowerCase();
  }
}

export { Service };
