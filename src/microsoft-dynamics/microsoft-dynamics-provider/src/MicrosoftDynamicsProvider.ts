import { Internal } from '@fusebit-int/framework';
import Client from 'dynamics-web-api';

type FusebitMicrosoftDynamicsClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class MicrosoftDynamicsProvider extends Internal.Provider.Activator<FusebitMicrosoftDynamicsClient> {
  /*
   * This function will create an authorized wrapper of the Microsoft-Dynamics SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMicrosoftDynamicsClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const serverUrl = credentials.scope.replace('/user_impersonation', '');
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
