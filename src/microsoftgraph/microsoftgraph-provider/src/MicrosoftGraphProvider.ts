import { Internal } from '@fusebit-int/framework';
import 'isomorphic-fetch';
import { AuthProvider, AuthProviderCallback, Client, Options } from '@microsoft/microsoft-graph-client';
import MicrosoftGraphWebhook from './MicrosoftGraphWebhook';

type FusebitMicrosoftGraphClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class MicrosoftGraphProvider extends Internal.Provider.Activator<FusebitMicrosoftGraphClient> {
  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new MicrosoftGraphWebhook(ctx, lookupKey, installId, this.config, client);
  };

  /*
   * This function will create an authorized wrapper of the MicrosoftGraph SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMicrosoftGraphClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });

    const authProvider: AuthProvider = (callback: AuthProviderCallback) => {
      callback(undefined, credentials.access_token);
    };
    const options: Options = {
      authProvider,
    };
    const client: FusebitMicrosoftGraphClient = Client.init(options);

    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };
    return client;
  }
}
