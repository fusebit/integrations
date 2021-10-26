import { Internal } from '@fusebit-int/framework';
import { api } from '@pagerduty/pdjs';

type FusebitPagerDutyClient = typeof api & { fusebit?: any };

export default class PagerDutyProvider extends Internal.ProviderActivator<FusebitPagerDutyClient> {
  /*
   * This function will create an authorized wrapper of the PagerDuty SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitPagerDutyClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitPagerDutyClient = api({ token: credentials.access_token, tokenType: 'Bearer' });
    client.fusebit = { credentials };
    return client;
  }
}
