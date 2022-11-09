import { Internal } from '@fusebit-int/framework';

export class ClearbitClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  private ctx: Internal.Types.Context;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
  }

  public makeApiClient(apiName: string, version = ''): Internal.Provider.ApiClient {
    return new Internal.Provider.ApiClient(
      (url: string) => `https://${apiName}.clearbit.com${version ? `/${version}` : ''}/${url}`,
      this.fusebit.connectorId,
      this.fusebit.credentials.access_token
    );
  }
}
