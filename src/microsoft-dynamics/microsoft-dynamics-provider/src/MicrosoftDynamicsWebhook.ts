import { Internal } from '@fusebit-int/framework';

class MicrosoftDynamicsWebhook extends Internal.Provider.WebhookClient {
  /**
   * Register a Microsoft Dynamics webhook secret
   * @param organizationId {string} The Microsoft Dynamics organization associates the secret with
   */
  public create = async (organizationId: string): Promise<void> => {
    await this.makeConnectorWebhookRequest<void>('post')('', {
      organizationId,
    });
  };

  /**
   * Generates a new Microsoft Dynamics webhook secret
   * @param organizationId {string} The Microsoft Dynamics organization associates the secret with
   */
  public update = async (organizationId: string): Promise<void> => {
    return await this.makeConnectorWebhookRequest<void>('patch')(organizationId);
  };

  /**
   * Delete a Microsoft Dynamics webhook secret associated to a specific organization
   * @param organizationId {string} The Microsoft Dynamics organization
   */
  public delete = async (organizationId: string) => {
    await this.makeConnectorWebhookRequest<void>('delete')(organizationId);
  };

  /**
   * Get a Microsoft Dynamics webhook secret associated to a specific organization
   * @param organizationId {string} The Microsoft Dynamics organization
   */
  public get = async (organizationId: string) => {
    return await this.makeConnectorWebhookRequest<void>('get')(organizationId);
  };

  public list = async () => {
    throw new Error('Method not supported');
  };

  public deleteAll = async () => {
    throw new Error('Method not supported');
  };
}

export default MicrosoftDynamicsWebhook;
