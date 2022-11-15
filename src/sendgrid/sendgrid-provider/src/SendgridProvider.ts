import { Internal } from '@fusebit-int/framework';
import client from '@sendgrid/client';

type FusebitSendgridClient = typeof client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class SendgridProvider extends Internal.Provider.Activator<FusebitSendgridClient> {
  /*
   * This function will create an authorized wrapper of the Sendgrid SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitSendgridClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client_: FusebitSendgridClient = client;
    client_.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };

    client_.setApiKey(credentials.access_token);
    return client_;
  }
}
