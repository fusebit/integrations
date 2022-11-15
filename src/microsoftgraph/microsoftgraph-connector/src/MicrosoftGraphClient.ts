import { Internal } from '@fusebit-int/framework';

import { IMicrosoftGraphSubscriptionData } from './types';

class MicrosoftGraphClient extends Internal.Provider.ApiClient {
  private baseUrl = 'https://graph.microsoft.com/';
  private ctx: Internal.Types.Context;
  private webhookUrl: string;

  constructor(ctx: Internal.Types.Context) {
    super((url: string) => `${this.baseUrl}/${url}`, ctx.state.params.entityId, ctx.body.accessToken);
    this.ctx = ctx;
    this.connectorId = ctx.state.params.entityId;
    this.baseUrl = `${this.ctx.state.params.endpoint}/v2/account/${this.ctx.state.params.accountId}/subscription/${this.ctx.state.params.subscriptionId}`;
    this.webhookUrl = `${this.baseUrl}/connector/${ctx.state.params.entityId}/api/fusebit/webhook/event`;
  }

  private createUrl(path: string, useBeta = false): string {
    return `${this.baseUrl}${useBeta ? 'beta' : 'v1.0'}/${path}`;
  }

  public async createSubscription(webhookData: IMicrosoftGraphSubscriptionData, clientState: string) {
    const {
      changeType,
      resource,
      expirationDateTime,
      includeResourceData,
      encryptionCertificate,
      encryptionCertificateId,
      useBeta,
      notificationQueryOptions,
      lifecycleNotificationUrl,
    } = webhookData;
    return this.makeRequest('post')(this.createUrl('subscriptions', useBeta), {
      changeType,
      resource,
      expirationDateTime,
      notificationUrl: this.webhookUrl,
      clientState,
      includeResourceData,
      encryptionCertificate,
      encryptionCertificateId,
      lifecycleNotificationUrl: lifecycleNotificationUrl || this.webhookUrl,
      notificationQueryOptions,
    });
  }

  public async updateSubscription(subscriptionId: string, expirationDateTime: string, useBeta = false) {
    return this.makeRequest('patch')(this.createUrl(`subscriptions/${subscriptionId}`, useBeta), {
      expirationDateTime,
    });
  }

  public async deleteSubscription(subscriptionId: string, useBeta = false) {
    return this.makeRequest('delete')(this.createUrl(`subscriptions/${subscriptionId}`, useBeta));
  }

  public async getSubscription(subscriptionId: string, useBeta = false) {
    return this.makeRequest('get')(this.createUrl(`subscriptions/${subscriptionId}`, useBeta));
  }

  public async listSubscriptions(useBeta = false) {
    return this.makeRequest('get')(this.createUrl('subscriptions', useBeta));
  }
}

export default MicrosoftGraphClient;
