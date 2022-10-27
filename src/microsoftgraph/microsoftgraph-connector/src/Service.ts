import { randomBytes, timingSafeEqual, privateDecrypt, createHmac, createDecipheriv } from 'crypto';

import { Connector } from '@fusebit-int/framework';
import { IOAuthToken, OAuthConnector } from '@fusebit-int/oauth-connector';

import { isTokenValid } from './tokenValidator';
import MicrosoftGraphClient from './MicrosoftGraphClient';
import { IMicrosoftGraphSubscriptionData, IMicrosoftGraphUpdateSubscriptionData } from './types';

class Service extends OAuthConnector.Service {
  private getStorageKey = (tenantId: string) => {
    return `webhook/ms-graph/tenant/${tenantId}`;
  };

  private getWebhookStorage = async (ctx: Connector.Types.Context, tenantId: string) => {
    return this.utilities.getData(ctx, this.getStorageKey(tenantId));
  };

  private isSubscriptionHealthCheck = (ctx: Connector.Types.Context) => {
    return !!ctx.query.validationToken;
  };

  public async configure(ctx: Connector.Types.Context, token: IOAuthToken) {
    // Associate the webhook secret with the authorizing tenant / directory
    const webhookStorage = await this.getWebhookStorage(ctx, token.params.tenantId);
    if (!webhookStorage) {
      const clientState = randomBytes(16).toString('hex');
      const lastUpdate = Date.now();
      await this.utilities.setData(ctx, this.getStorageKey(token.params.tenantId), {
        data: { clientState, lastUpdate },
      });
    }
  }

  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    if (this.isSubscriptionHealthCheck(ctx)) {
      return [];
    }

    // If resource data is encrypted and a key-pair is configured, decrypt it before returning the payload.
    const payload = ctx.req.body.value[0];
    const { privateKey } = ctx.state.manager.config.configuration;

    if (payload.encryptedContent && privateKey) {
      try {
        const { dataSignature, data, dataKey } = payload.encryptedContent;
        delete payload.encryptedContent;
        // Decrypt the symetric key
        const base64encodedKey = dataKey;
        const asymetricPrivateKey = privateKey
          .replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN RSA PRIVATE KEY-----\n')
          .replace('-----END RSA PRIVATE KEY-----', '\n-----END RSA PRIVATE KEY-----');
        const decodedKey = Buffer.from(base64encodedKey, 'base64');
        const decryptedSymetricKey = privateDecrypt(asymetricPrivateKey, decodedKey);
        const hmac = createHmac('sha256', decryptedSymetricKey);
        hmac.write(data, 'base64');

        // Compare data signature using HMAC-SHA256
        // If they do not match, assume the payload has been tampered with and do not decrypt it
        const dataSignatureBuffer = Buffer.from(dataSignature, 'utf8');
        const hmacBuffer = Buffer.from(hmac.digest('base64'), 'utf8');
        if (timingSafeEqual(dataSignatureBuffer, hmacBuffer)) {
          // Continue with decryption of the encryptedPayload.
          const iv = Buffer.alloc(16, 0);
          decryptedSymetricKey.copy(iv, 0, 0, 16);
          const decipher = createDecipheriv('aes-256-cbc', decryptedSymetricKey, iv);
          let decryptedPayload = decipher.update(data, 'base64', 'utf8');
          decryptedPayload += decipher.final('utf8');

          return [{ ...payload, decryptedPayload: JSON.parse(decryptedPayload) }];
        }
      } catch (error) {
        console.log(`Failed to decrypt resource data: ${(error as any).message}`);
        // If we fail to decrypt, lets just return the original data with encrypted content.
        return [{ ...payload }];
      }
    }
    return [{ ...payload }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    if (!this.isSubscriptionHealthCheck(ctx)) {
      return `tenant/${event.tenantId || event.organizationId}`;
    }
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    // Subscription creation health check
    if (this.isSubscriptionHealthCheck(ctx)) {
      return true;
    }

    if (!ctx.req.body?.value) {
      return false;
    }

    // If the request is coming from a triggered subscription
    const { clientState, tenantId, organizationId } = ctx.req.body?.value[0];
    if (!clientState && !tenantId && !organizationId) {
      return false;
    }

    const webhookStorage = await this.getWebhookStorage(ctx, tenantId || organizationId);
    if (!webhookStorage) {
      return false;
    }

    const requestSecretBuffer = Buffer.from(clientState, 'utf8');
    const storedSecretBuffer = Buffer.from(webhookStorage.data.clientState, 'utf8');
    let isClientStateEqual = false;

    try {
      isClientStateEqual = timingSafeEqual(requestSecretBuffer, storedSecretBuffer);
    } catch (error) {
      // Omit any error here, since it can throw an error for many reasons, like different byte length, etc.
    }

    // Subscriptions with resource data include an extra property to verify validation tokens.
    if (ctx.req.body.validationTokens) {
      const { clientId } = ctx.state.manager.config.configuration;
      for await (const token of ctx.req.body.validationTokens) {
        const isValid = await isTokenValid(token, clientId, tenantId || organizationId);
        if (!isValid) {
          return false;
        }
      }
    }

    return isClientStateEqual;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: IOAuthToken): Promise<string | string[] | void> {
    return [`tenant/${token.params.tenantId}`];
  }

  public async createWebhookResponse(ctx: Connector.Types.Context): Promise<void> {
    if (!this.isSubscriptionHealthCheck(ctx)) {
      return;
    }
    ctx.header['content-type'] = 'text/plain';
    ctx.body = ctx.request.query.validationToken;
  }

  public getWebhookEventType(event: any): string {
    if (event.lifecycleEvent) {
      return `lifecycleEvent:${event.lifecycleEvent}`;
    }
    return event.changeType;
  }

  public async registerWebhook(
    ctx: Connector.Types.Context,
    tenantId: string,
    data: IMicrosoftGraphSubscriptionData & { accessToken: string }
  ) {
    if (data.includeResourceData) {
      const { clientId, publicKey } = ctx.state.manager.config.configuration;
      if (data.includeResourceData) {
        // Since we don't manage multiple encryption certificates, we don't get much value from providing
        // an identifier, although its a required property.
        data.encryptionCertificateId = `cert-${clientId}`;
        data.encryptionCertificate = publicKey;
      }
    }
    const microsoftGraphClient = new MicrosoftGraphClient(ctx, { accessToken: data.accessToken });
    // We keep a Webhook secret per Azure tenant (1 to n subscriptions)
    const webhookStorage = await this.getWebhookStorage(ctx, tenantId);
    if (!webhookStorage) {
      ctx.throw('Webhook client state Not Found', 404);
    }

    return microsoftGraphClient.createSubscription(data, webhookStorage.data.clientState);
  }

  public async updateWebhook(
    ctx: Connector.Types.Context,
    subscriptionId: string,
    data: IMicrosoftGraphUpdateSubscriptionData
  ) {
    const microsoftGraphClient = new MicrosoftGraphClient(ctx, { accessToken: data.accessToken });
    return microsoftGraphClient.updateSubscription(subscriptionId, data.expirationDateTime);
  }

  public async deleteWebhook(
    ctx: Connector.Types.Context,
    subscriptionId: string,
    data: IMicrosoftGraphUpdateSubscriptionData
  ) {
    const microsoftGraphClient = new MicrosoftGraphClient(ctx, { accessToken: data.accessToken });
    return microsoftGraphClient.deleteSubscription(subscriptionId);
  }

  public async getWebhook(
    ctx: Connector.Types.Context,
    subscriptionId: string,
    data: IMicrosoftGraphUpdateSubscriptionData
  ) {
    const microsoftGraphClient = new MicrosoftGraphClient(ctx, { accessToken: data.accessToken });
    return microsoftGraphClient.getSubscription(subscriptionId);
  }

  public async listWebhooks(ctx: Connector.Types.Context, data: IMicrosoftGraphUpdateSubscriptionData) {
    const microsoftGraphClient = new MicrosoftGraphClient(ctx, { accessToken: data.accessToken });
    return microsoftGraphClient.listSubscriptions();
  }
}

export { Service };
