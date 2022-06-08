import { Internal } from '@fusebit-int/framework';
import { XeroClient as Client, TokenSet } from 'xero-node';

type FusebitXeroClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class XeroProvider extends Internal.Provider.Activator<FusebitXeroClient> {
  /*
   * This function will create an authorized wrapper of the Xero SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitXeroClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitXeroClient = new Client();
    client.setTokenSet((credentials as any) as TokenSet);
    await client.updateTenants();
    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };
    return client;
  }
}
