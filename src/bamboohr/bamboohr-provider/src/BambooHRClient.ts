import { Internal } from '@fusebit-int/framework';
import BasicAuthClient from './BasicAuthClient';
import { BambooHRToken } from './types';

class BambooHRClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  public rest: BasicAuthClient;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.fusebit = fusebit;
    const { api_key, company_domain } = (this.fusebit.credentials as unknown) as BambooHRToken;
    this.rest = new BasicAuthClient(
      (url: string) => `https://api.bamboohr.com/api/gateway.php/${company_domain}/v1/${url}`,
      this.fusebit.connectorId,
      api_key
    );
  }
}

export { BambooHRClient };
