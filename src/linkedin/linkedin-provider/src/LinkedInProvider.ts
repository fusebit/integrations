import { Internal } from '@fusebit-int/framework';
import { LinkedInClient as Client, LinkedInClient } from './LinkedInClient';

type FusebitLinkedInClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class LinkedInProvider extends Internal.Provider.Activator<FusebitLinkedInClient> {
  /*
   * This function will create an authorized wrapper of the LinkedIn SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitLinkedInClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: LinkedInClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
