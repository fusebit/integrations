import { api } from '@pagerduty/pdjs';
import { PartialCall } from '@pagerduty/pdjs/build/src/api';
import { Internal } from '@fusebit-int/framework';
import PagerDutyWebhook from './PagerDutyWebhook';

// PagerDuty is a special case with it's SDK structure
// PartialCall is the type of return when you run `await api()`
type FusebitPagerDutyClient = PartialCall & { fusebit?: any };

export default class PagerDutyProvider extends Internal.ProviderActivator<FusebitPagerDutyClient> {
  /**
   * This function will create an authorized webhook SDK for PagerDuty.
   */
  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new PagerDutyWebhook(ctx, lookupKey, installId, this.config, client);
  };

  /*
   * This function will create an authorized wrapper of the PagerDuty SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitPagerDutyClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitPagerDutyClient = api({ token: credentials.access_token, tokenType: 'bearer' });
    client.fusebit = { credentials };
    return client;
  }
}
