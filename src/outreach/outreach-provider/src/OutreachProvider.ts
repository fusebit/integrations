import { Internal } from '@fusebit-int/framework';
import { OutreachClient as Client } from './OutreachClient';

type FusebitOutreachClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class OutreachProvider extends Internal.Provider.Activator<FusebitOutreachClient> {
  /*
   * This function will create an authorized wrapper of the Outreach SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitOutreachClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitOutreachClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
