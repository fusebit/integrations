import { Internal } from '@fusebit-int/framework';
export default class ZoomProvider extends Internal.Provider.Activator<Internal.Provider.ApiClient> {
  /*
   * This function will create an authorized wrapper of the Zoom SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<Internal.Provider.ApiClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: Internal.Provider.ApiClient = new Internal.Provider.ApiClient(
      (url) => `https://api.zoom.us/v2${url}`,
      this.config.entityId,
      credentials.access_token
    );

    return client;
  }
}
