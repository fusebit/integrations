import { Internal } from '@fusebit-int/framework';
import { ClickUpClient as Client } from './ClickUpClient';

type FusebitClickUpClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class ClickUpProvider extends Internal.Provider.Activator<FusebitClickUpClient> {
  /*
   * This function will create an authorized wrapper of the ClickUp SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitClickUpClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitClickUpClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
