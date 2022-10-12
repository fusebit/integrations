import { Internal } from '@fusebit-int/framework';
import { Types } from '@fusebit-int/microsoftgraph-connector';

class MicrosoftGraphWebhook extends Internal.Provider.WebhookClient {
  /**
   * @typedef {object} MicrosoftGraphSubscription
   * @property {string} id Unique identifier of the subscription
   * @property {string} resource Resource that will be monitored for changes
   * @property {string} applicationId Identifier of the application used to create the subscription
   * @property {string} changeType Indicates the type of change in the subscribed resource that will raise a change notification
   * @property {string} clientState Secret used to validate a change notification
   * @property {string} notificationUrl The URL of the endpoint that will receive the change notifications
   * @property {string} expirationDateTime Specifies the date and time when the webhook subscription expires in UTC
   * @property {string} creatorId Identifier of the user or service principal that created the subscription
   * @property {string} notificationQueryOptions OData query options for specifying value for the targeting resource
   * @property {string} lifecycleNotificationUrl The URL of the endpoint that receives lifecycle notifications
   * @property {boolean} includeResourceData When set to true, change notifications include resource data (such as content of a chat message)
   * @property {string} latestSupportedTlsVersion TLS version supported by the notificationUrl
   * @property {string} encryptionCertificate A base64-encoded representation of a certificate with a public key used to encrypt resource data in change notifications
   * @property {string} encryptionCertificateId A custom app-provided identifier to help identify the certificate needed to decrypt resource data
   * @property {string} notificationUrlAppId The app ID that the subscription service can use to generate the validation token
   */

  /**
   * @typedef {object} MicrosoftGraphSubscriptionResponse
   * @property {string} @odata.context
   * @property {Array.<MicrosoftGraphSubscription>} value
   */

  /**
   * @typedef {object} MicrosoftGraphSubscriptionData
   * @property {string} tenantId The global identifier of the Azure directory
   * @property {string} changeType The supported values are: created, updated, deleted. Multiple values can be combined using a comma-separated list
   * @property {string} resource Resource that will be monitored for changes
   * @property {string} expirationDateTime Specifies the date and time in UTC when the webhook subscription expires
   */

  /**
   * Register a new BambooHR webhook
   * @param {MicrosoftGraphSubscriptionData} args The configuration for the Microsoft Graph Webhook.
   * @returns {MicrosoftGraphSubscriptionResponse} Webhook created
   */
  public create = async (
    tenantId: string,
    webhookData: Types.IMicrosoftGraphSubscriptionData
  ): Promise<Types.IMicrosoftGraphSubscription> => {
    return this.makeConnectorWebhookRequest<Types.IMicrosoftGraphSubscription>('post')(tenantId, {
      ...webhookData,
      accessToken: this.client.fusebit.credentials.access_token,
    });
  };

  /**
   * Renew a subscription by extending its expiry time.
   * @param {string} subscriptionId Unique identifier of the subscription to update
   * @param {string} expirationDateTime Specifies the date and time in UTC when the webhook subscription expires
   * @returns {MicrosoftGraphSubscriptionResponse} Updated subscription
   */
  public update = async (
    subscriptionId: string,
    expirationDateTime: string
  ): Promise<Types.IMicrosoftGraphSubscription> => {
    return this.makeConnectorWebhookRequest<Types.IMicrosoftGraphSubscription>('patch')(subscriptionId, {
      expirationDateTime,
      accessToken: this.client.fusebit.credentials.access_token,
    });
  };

  /**
   * Delete a Microsoft Graph Webhook
   * @param subscriptionId {string} Microsoft Graph Webhook identifier
   */
  public delete = async (subscriptionId: string) => {
    await this.makeConnectorWebhookRequest<void>('delete')(subscriptionId, {
      accessToken: this.client.fusebit.credentials.access_token,
    });
  };

  /**
   * Get a Microsoft Graph Webhook
   * @param subscriptionId {string} Microsoft Graph Webhook identifier
   */
  public get = async (subscriptionId: string): Promise<Types.IMicrosoftGraphSubscription> => {
    return this.makeConnectorWebhookRequest<Types.IMicrosoftGraphSubscription>('get')(subscriptionId, {
      accessToken: this.client.fusebit.credentials.access_token,
    });
  };

  /**
   * List Microsoft Graph Webhooks
   * You can retrieve the next page of results by sending the URL value of the @odata.nextLink
   */
  public list = async (): Promise<Types.IMicrosoftGraphSubscriptionList> => {
    return this.makeConnectorWebhookRequest<Types.IMicrosoftGraphSubscriptionList>('get')('/', {
      accessToken: this.client.fusebit.credentials.access_token,
    });
  };

  /**
   * Deletes all Microsoft Graph Webhooks
   */
  public deleteAll = async () => {
    const { value: webhooks } = await this.list();
    await Promise.all(webhooks.map(async (webhook: Types.IMicrosoftGraphSubscription) => this.delete(webhook.id)));
  };
}

export default MicrosoftGraphWebhook;
