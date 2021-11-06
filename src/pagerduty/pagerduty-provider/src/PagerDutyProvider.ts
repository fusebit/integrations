import { Internal } from '@fusebit-int/framework';
import { api } from '@pagerduty/pdjs';

export default class PagerDutyProvider extends Internal.ProviderActivator<FusebitPagerDutyClient> {
  /*
   * This function will create an authorized wrapper of the PagerDuty SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitPagerDutyClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitPagerDutyClient = await api({ token: credentials.access_token, tokenType: 'bearer' });
    client.fusebit = { credentials };
    return client;
  }
}
