import { Internal } from '@fusebit-int/framework';
import Asana from 'asana';
import superagent from 'superagent';

class AsanaWebhook implements Internal.Types.WebhookClient {
  constructor(
    ctx: Internal.Types.Context,
    lookupKey: string,
    installId: string,
    config: Internal.Types.IInstanceConnectorConfig,
    client: FusebitAsanaClient
  ) {
    this.ctx = ctx;
    this.client = client;
    this.config = config;
    this.lookupKey = lookupKey;
    this.installId = installId;
  }
  private client;
  private ctx;
  private config;
  private lookupKey;
  private installId;

  /**
   * Establishing an Asana webhook with fusebit is a simple process.  This method functions similarly to the
   * one provided by the asana client.  However, fusebit has already handled managing webhook endpoints, validation,
   * and initial setup steps.
   *
   * The parameters of this method are the same as the Asana Client's webhook creation method's, with the exception of
   * the `target` url.  This argument has been removed, as Fusebit will register the webhooks on your behalf.
   *
   * You may choose to consult the Asana Client documentation for additional information about these parameters.
   *
   * @param {String|Number} resource A resource ID to subscribe to. The resource can be a task or project.
   * @param {Object} data Data for the request
   * @param {Object} [dispatchOptions] Options, if any, to pass the dispatcher for the request
   * @return {Promise} The response from the API
   */
  public create = async (
    resource: string | number,
    data: any,
    dispatchOptions?: any
  ): Promise<Asana.resources.Webhooks.Type> => {
    const params = this.ctx.state.params;

    const createWebhookUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}/api/fusebit_webhook_create`;
    const createWebhookResponse = await superagent.post(createWebhookUrl).set('Authorization', `Bearer ${params.functionAccessToken}`);
    const { webhookId } = createWebhookResponse.body;

    const webhookTag = encodeURIComponent(['webhook', this.config.entityId, webhookId].join('/'));
    const tagUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/integration/${params.entityId}/install/${this.installId}/tag/${webhookTag}/null`;
    await superagent.put(tagUrl).set('Authorization', `Bearer ${params.functionAccessToken}`);

    const webhookUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}/api/fusebit_webhook_event/${webhookId}`;

    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.client.webhooks.create(resource, webhookUrl, data, dispatchOptions));
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Returns the full record for the given webhook.
   * @param {String} webhook The webhook to get.
   * @param {Object} [params] Parameters for the request
   * @param {Object} [dispatchOptions] Options, if any, to pass the dispatcher for the request
   * @return {Promise} The requested resource
   */
  public get = async (webhook: string, params?: any, dispatchOptions?: any): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.client.webhooks.getById(webhook, params, dispatchOptions));
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Returns the compact representation of all webhooks your app has
   * registered for the authenticated user in the given workspace.
   * @param {String|Number} workspace The workspace to query for webhooks in.
   * @param {Object} [params] Parameters for the request
   * @param {String|Number} [params.resource] Only return webhooks for the given resource.
   * @param {Object} [dispatchOptions] Options, if any, to pass the dispatcher for the request
   * @return {Promise} The response from the API
   */
  public getAll = async (
    workspace: string | number,
    params?: any,
    dispatchOptions?: any
  ): Promise<Asana.resources.Webhooks.Type[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.client.webhooks.getAll(workspace, params, dispatchOptions));
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * This method permanently removes a webhook. Note that it may be possible
   * to receive a request that was already in flight after deleting the
   * webhook, but no further requests will be issued.
   * @param {String} webhook The webhook to delete.
   * @param {Object} [dispatchOptions] Options, if any, to pass the dispatcher for the request
   * @return {Promise} The response from the API
   */
  public delete = async (webhook: string, dispatchOptions?: any): Promise<Asana.resources.Webhooks.Type> => {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.client.webhooks.deleteById(webhook, dispatchOptions));
      } catch (e) {
        reject(e);
      }
    });
  };
}

export default AsanaWebhook;
