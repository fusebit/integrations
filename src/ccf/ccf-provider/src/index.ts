import { Internal } from '@fusebit-int/framework';

export default class CcfProvider extends Internal.Provider.Activator<{ accessToken: string }> {
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<{ accessToken: string }> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    return {
      accessToken: credentials.access_token,
    };
  }
}
