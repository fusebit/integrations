import { Internal } from '@fusebit-int/framework';

class MicrosoftDynamicsWebhook extends Internal.Provider.WebhookClient {
  private getCredentials() {
    const { organizationId, organizationName } = this.client.fusebit.credentials.params;
    return {
      accessToken: this.client.fusebit.credentials.access_token,
      organizationId,
      organizationName,
    };
  }

  public update = async (): Promise<void> => {
    throw new Error('Method not supported');
  };

  /**
   * Delete the Microsoft Dynamics Webhook step
   * @param webhookStepId {string} The Microsoft Dynamics Webhook step unique identifier
   */
  public delete = async (webhookStepId: string) => {
    return this.makeConnectorWebhookRequest('delete')(`steps/${webhookStepId}`, this.getCredentials());
  };

  /**
   * Deletes the Microsoft Dynamics Webhook generated automatically by Fusebit.
   */
  public deleteWebhook = async () => {
    return this.makeConnectorWebhookRequest('delete')('organization', this.getCredentials());
  };

  /**
   * Get the Microsoft Dynamics Webhook step
   * @param webhookStepId {string} The Microsoft Dynamics Webhook step unique identifier
   */
  public get = async (webhookStepId: string) => {
    return this.makeConnectorWebhookRequest('get')(`steps/${webhookStepId}`, this.getCredentials());
  };

  /**
   * Get the Microsoft Dynamics Webhook generated automatically by Fusebit.
   */
  public getWebhook = async () => {
    return this.makeConnectorWebhookRequest('get')('', this.getCredentials());
  };

  public create = async (): Promise<void> => {
    throw new Error('Method not supported');
  };

  public list = async () => {
    return this.makeConnectorWebhookRequest('get')('steps', this.getCredentials());
  };

  public deleteAll = async () => {
    const response = await this.list();
    await Promise.all(
      (response as any).value.map(async (webhook: { sdkmessageprocessingstepid: string }) =>
        this.delete(webhook.sdkmessageprocessingstepid)
      )
    );
  };
}

export default MicrosoftDynamicsWebhook;
