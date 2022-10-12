import { Connector } from '@fusebit-int/framework';
import superagent from 'superagent';

import { IMicrosoftGraphSubscriptionData, IMicrosoftGraphUpdateSubscriptionData } from './types';

export interface IClientConfig {
  accessToken: string;
}

const BASE_PATH = 'https://graph.microsoft.com/';

class MicrosoftGraphClient {
  private config: IClientConfig;
  private ctx: Connector.Types.Context;

  constructor(ctx: Connector.Types.Context, config: IClientConfig) {
    this.ctx = ctx;
    this.config = config;
  }

  public async createSubscription(webhookData: IMicrosoftGraphSubscriptionData, clientState: string) {
    const baseUrl = `${this.ctx.state.params.endpoint}/v2/account/${this.ctx.state.params.accountId}/subscription/${this.ctx.state.params.subscriptionId}`;
    const webhookUrl = `${baseUrl}/connector/${this.ctx.state.params.entityId}/api/fusebit/webhook/event`;
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
    return this.makeRequest('post', useBeta)('subscriptions', {
      changeType,
      resource,
      expirationDateTime,
      notificationUrl: webhookUrl,
      clientState,
      includeResourceData,
      encryptionCertificate,
      encryptionCertificateId,
      lifecycleNotificationUrl: lifecycleNotificationUrl || webhookUrl,
      notificationQueryOptions,
    });
  }

  public async updateSubscription(subscriptionId: string, expirationDateTime: string, useBeta = false) {
    return this.makeRequest('patch', useBeta)(`subscriptions/${subscriptionId}`, {
      expirationDateTime,
    });
  }

  public async deleteSubscription(subscriptionId: string, useBeta = false) {
    return this.makeRequest('delete', useBeta)(`subscriptions/${subscriptionId}`);
  }

  public async getSubscription(subscriptionId: string, useBeta = false) {
    return this.makeRequest('get', useBeta)(`subscriptions/${subscriptionId}`);
  }

  public async listSubscriptions(useBeta = false) {
    return this.makeRequest('get', useBeta)('subscriptions');
  }

  public makeRequest(method: string, useBeta = false) {
    return async (path: string, data?: any) => {
      return (
        await (superagent as any)
          [method](`${BASE_PATH}${useBeta ? 'beta' : 'v1.0'}/${path}`)
          .set('Authorization', `Bearer ${this.config.accessToken}`)
          .send(data)
      ).body;
    };
  }
}

export default MicrosoftGraphClient;
