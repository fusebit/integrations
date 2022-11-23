import { Internal } from '@fusebit-int/framework';
import Client from 'dynamics-web-api';
import MicrosoftDynamicsWebhook from './MicrosoftDynamicsWebhook';

type FusebitMicrosoftDynamicsClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class MicrosoftDynamicsProvider extends Internal.Provider.Activator<FusebitMicrosoftDynamicsClient> {
  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new MicrosoftDynamicsWebhook(ctx, lookupKey, installId, this.config, client);
  };

  /*
   * This function will create an authorized wrapper of the Microsoft-Dynamics SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMicrosoftDynamicsClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const serverUrl = `https://${credentials.params?.organizationName}.api.crm.dynamics.com`;
    const client: FusebitMicrosoftDynamicsClient = new Client({
      webApiUrl: `${serverUrl}/api/data/v9.2/`,
      onTokenRefresh: (_) => _(credentials.access_token),
    });
    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };
    return client;
  }
}
