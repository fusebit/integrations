import { Internal } from '@fusebit-int/framework';
import { ZoomClient as Client } from 'zoom';

type FusebitZoomClient = Client & { fusebit?: any };

export default class ZoomProvider extends Internal.ProviderActivator<FusebitZoomClient> {
  /*
   * This function will create an authorized wrapper of the Zoom SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitZoomClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitZoomClient = new Client({ accessToken: credentials.access_token });
    client.fusebit = { credentials };
    return client;
  }
}
