import { Internal } from '@fusebit-int/framework';

class LoomClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  private ctx: Internal.Types.Context;
  private connectorId: string;

  private baseUrl: string;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.connectorId = fusebit.connectorId;
    const params = ctx.state.params;
    this.baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/integration/${params.entityId}`;
  }
}

export { LoomClient };
