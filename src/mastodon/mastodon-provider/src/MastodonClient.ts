import { Internal } from '@fusebit-int/framework';

class MastodonClient extends Internal.Provider.ApiClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  private baseUrl: string;
  private ctx: Internal.Types.Context;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    super((url: string) => `${this.baseUrl}${url}`, fusebit.connectorId, fusebit.credentials.access_token);
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.connectorId = fusebit.connectorId;
    this.baseUrl = (fusebit.credentials as any).baseUrl;
  }
}

export { MastodonClient };
