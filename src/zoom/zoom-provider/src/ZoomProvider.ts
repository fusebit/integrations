import { Internal } from '@fusebit-int/framework';
import { ZoomClient as Client, IZoomConfiguration, IZoomCredentials } from './ZoomClient';

type FusebitZoomClient = Client & { fusebit?: any };

export default class ZoomProvider extends Internal.Provider.Activator<FusebitZoomClient> {
  /*
   * This function will create an authorized wrapper of the Zoom SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitZoomClient> {
    const credentials = (await this.requestConnectorToken({ ctx, lookupKey })) as IZoomCredentials;
    const client: FusebitZoomClient = new Client({ connectorId: this.config.entityId, credentials });

    return client;
  }
}
