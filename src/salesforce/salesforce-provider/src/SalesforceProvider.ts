import { Internal } from '@fusebit-int/framework';
import jsforce from 'jsforce';

import SalesforceWebhook from './SalesforceWebhook';
import { FusebitClient } from './types';

export default class SalesforceProvider extends Internal.Provider.Activator<FusebitClient> {
  /*
   * This function will create an authorized wrapper of the Salesforce client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const options = {
      instanceUrl: credentials.instance_url,
      accessToken: credentials.access_token,
    };
    const client: FusebitClient = new jsforce.Connection(options);
    client.fusebit = { credentials };
    return client;
  }

  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new SalesforceWebhook(ctx, lookupKey, installId, this.config, client);
  };
}
