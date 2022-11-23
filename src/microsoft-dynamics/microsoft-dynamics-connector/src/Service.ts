import { Connector } from '@fusebit-int/framework';
import { IOAuthToken } from '@fusebit-int/oauth-connector';
import { randomBytes, timingSafeEqual } from 'crypto';

import MicrosofDynamicsClient from './MicrosoftDynamicsClient';

import { IWebhookStepData } from './Types';

const MICROSOFT_DYNAMICS_WEBHOOK_NAME = 'Fusebit';

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
    await this.utilities.setData(ctx, this.getStorageKey(organizationId), { data: { secret, lastUpdate } });
    return { secret, lastUpdate };
  };
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [{ ...ctx.req.body }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return `organization/${event.OrganizationId}`;
  }

  private mapStageToValue = (stage: string) => {
    switch (stage) {
      case 'pre-validation':
        return 10;
      case 'pre-operation':
        return 20;
      case 'post-operation':
        return 40;
      default:
        return 40;
    }
  };

  private async registerWebhookSteps(
    dynamicsClient: MicrosofDynamicsClient,
    webhooks: Array<IWebhookStepData>,
    webhookId: string
  ) {
    for await (const { sdkMessageFilter, sdkMessage, stage } of webhooks) {
      const sdkMessageResponse = await dynamicsClient.getSdkMessageId(sdkMessageFilter, sdkMessage);

      if (!sdkMessageResponse) {
        console.log(
          `Could not find a message ${sdkMessage} for filter ${sdkMessageFilter} ensure your Microsoft Dynamics instance is properly configured`
        );
        continue;
      }

      const { sdkMessageFilterId, sdkMessageId } = sdkMessageResponse;
      const stepName = `${sdkMessageFilter}:${sdkMessage}`;
      const stageValue = this.mapStageToValue(stage);
      const webhookStep = await dynamicsClient.getWebhookStep(webhookId, sdkMessageId, stepName, stageValue);

      // Ensure we don't have a duplicated step.
      if (!webhookStep) {
        await dynamicsClient.createWebhookStep({
          name: stepName,
          stage: stageValue,
          rank: 1,
          serviceEndpointId: webhookId,
          messageId: sdkMessageId,
          messageFilterId: sdkMessageFilterId,
          supportedDeployment: 0, // Always 0 for server
        });
      }
    }
  }

  private async createOrRetrieveWebhook(dynamicsClient: MicrosofDynamicsClient, webhookSecret: string) {
    // The Webhook registration operation needs to happen only once per organization.
    const webhook = await dynamicsClient.getWebhookByName(MICROSOFT_DYNAMICS_WEBHOOK_NAME);

    if (webhook) {
      return webhook;
    }

    await dynamicsClient.createWebhook({
      name: MICROSOFT_DYNAMICS_WEBHOOK_NAME,
      contract: 8, // Means Webhook
      authtype: 4, // Means Webhook Key
      authvalue: webhookSecret,
    });

    return dynamicsClient.getWebhookByName(MICROSOFT_DYNAMICS_WEBHOOK_NAME);
  }

  private async retrieveWebhookSecretFromStorage(ctx: Connector.Types.Context, organizationId: string) {
    const webhookStorage = await this.getWebhookStorage(ctx, organizationId);
    if (webhookStorage) {
      return webhookStorage?.data.secret;
    }
    const { secret } = await this.updateWebhookStorage(ctx, organizationId);
    return secret;
  }

  public async configure(ctx: Connector.Types.Context, token: IOAuthToken) {
    try {
      const { webhooks } = ctx.state.manager.config.configuration.splash;

      // So far, this configuration step is for Webhooks only, hence we're skipping if no webhooks are configured,
      // Be careful if you want to run any other configuration here aside of Webhooks.
      if (!webhooks?.length) {
        return;
      }

      // Generate a new Webhook secret associated to the specific organization.
      const authSecret = await this.retrieveWebhookSecretFromStorage(ctx, token.params.organizationId);
      const dynamicsClient = new MicrosofDynamicsClient(ctx, token.params.organizationName, token.access_token);
      const microsoftDynamicsWebhook = await this.createOrRetrieveWebhook(dynamicsClient, authSecret);

      if (!microsoftDynamicsWebhook) {
        console.log(`Unable to find a Fusebit webhook for organization ${token.params.organizationName}`);
        return;
      }

      // Register Webhook Steps based on Connector configuration
      await this.registerWebhookSteps(dynamicsClient, webhooks, microsoftDynamicsWebhook.serviceendpointid);
    } catch (error) {
      console.log(
        `Failed to register webhook for organization ${token.params.organizationName}: ${(error as any).message}`
      );
      ctx.throw(
        `Failed to register webhook for organization ${token.params.organizationName}: ${(error as any).message}`
      );
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

  public async getWebhookSteps(ctx: Connector.Types.Context) {
    const { accessToken, organizationName } = ctx.req.body;
    const dynamicsClient = new MicrosofDynamicsClient(ctx, organizationName, accessToken);
    const webhook = await dynamicsClient.getWebhookByName(MICROSOFT_DYNAMICS_WEBHOOK_NAME);
    if (!webhook) {
      return (ctx.status = 404);
    }
    return dynamicsClient.getWebhookSteps(webhook.serviceendpointid);
  }

  public async getWebhookStep(ctx: Connector.Types.Context) {
    const { accessToken, organizationName } = ctx.req.body;
    const dynamicsClient = new MicrosofDynamicsClient(ctx, organizationName, accessToken);
    return dynamicsClient.getWebhookStepById(ctx.params.webhookStepId);
  }

  public getWebhook = async (ctx: Connector.Types.Context) => {
    const { accessToken, organizationName } = ctx.req.body;
    const dynamicsClient = new MicrosofDynamicsClient(ctx, organizationName, accessToken);
    return dynamicsClient.getWebhookByName(MICROSOFT_DYNAMICS_WEBHOOK_NAME);
  };

  public deleteWebhookStep = async (ctx: Connector.Types.Context) => {
    const { accessToken, organizationName } = ctx.req.body;
    const dynamicsClient = new MicrosofDynamicsClient(ctx, organizationName, accessToken);
    return dynamicsClient.deleteWebhookStep(ctx.params.webhookStepId);
  };

  public deleteWebhook = async (ctx: Connector.Types.Context) => {
    const { accessToken, organizationName, organizationId } = ctx.req.body;
    const dynamicsClient = new MicrosofDynamicsClient(ctx, organizationName, accessToken);
    await this.utilities.deleteData(ctx, this.getStorageKey(organizationId));
    const webhook = await dynamicsClient.getWebhookByName(MICROSOFT_DYNAMICS_WEBHOOK_NAME);
    if (!webhook) {
      return (ctx.status = 404);
    }

    return dynamicsClient.deleteWebhook(webhook.serviceendpointid);
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
