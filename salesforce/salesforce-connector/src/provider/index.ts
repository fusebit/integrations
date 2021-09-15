import { Internal } from '@fusebit-int/framework';
import jsforce from 'jsforce';

type FusebitClient = jsforce.Connection & { fusebit?: any };

export default class SalesforceProvider extends Internal.ProviderActivator<FusebitClient> {
  /*
   * This function will create an authorized wrapper of the Salesforce client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const options = {
      instanceUrl: credentials.instance_url,
      accessToken: credentials.access_token,
    };
    const client: FusebitClient = new jsforce.Connection(options);
    client.fusebit = { credentials };
    return client;
  }
}
