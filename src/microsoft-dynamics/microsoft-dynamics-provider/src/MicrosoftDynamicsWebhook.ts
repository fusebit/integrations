import { Internal } from '@fusebit-int/framework';

class MicrosoftDynamicsWebhook extends Internal.Provider.WebhookClient {
  /**
   * Generates the new Microsoft Dynamics webhook secret
   * @param organizationId {string} The Microsoft Dynamics organization associates the secret with
   */
  public update = async (organizationId: string): Promise<void> => {
    return this.makeConnectorWebhookRequest<void>('patch')(organizationId);
  };

  /**
   * Delete the Microsoft Dynamics webhook secret associated to a specific organization
   * @param organizationId {string} The Microsoft Dynamics organization
   */
  public delete = async (organizationId: string) => {
    await this.makeConnectorWebhookRequest<void>('delete')(organizationId);
  };

  /**
   * Get the Microsoft Dynamics webhook secret associated to a specific organization
   * @param organizationId {string} The Microsoft Dynamics organization
   */
  public get = async (organizationId: string) => {
    return this.makeConnectorWebhookRequest<void>('get')(organizationId);
  };

  public create = async (): Promise<void> => {
    throw new Error('Method not supported');
  };

  public list = async () => {
    throw new Error('Method not supported');
  };

  public deleteAll = async () => {
    throw new Error('Method not supported');
  };
}

export default MicrosoftDynamicsWebhook;
