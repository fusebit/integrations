import { Internal } from '@fusebit-int/framework';

class LinkedInClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  private baseUrl = 'https://api.linkedin.com/v2';
  private ctx: Internal.Types.Context;
  private connectorId: string;

  public api!: Internal.Provider.ApiClient;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.connectorId = fusebit.connectorId;
  }

  async initialize() {
    this.api = new Internal.Provider.ApiClient(
      (url: string) => `${this.baseUrl}/${url}`,
      this.connectorId,
      this.fusebit.credentials.access_token
    );
  }
}

export { LinkedInClient };
