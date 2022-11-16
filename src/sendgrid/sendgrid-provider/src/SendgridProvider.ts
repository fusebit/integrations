import { Internal } from '@fusebit-int/framework';
import { Client } from '@sendgrid/client';

type FusebitSendgridClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class SendgridProvider extends Internal.Provider.Activator<FusebitSendgridClient> {
  /*
   * This function will create an authorized wrapper of the Sendgrid SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitSendgridClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitSendgridClient = new Client();
    console.log(client.fusebit);
    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };

    client.setApiKey(credentials.access_token);
    return client;
  }
}
