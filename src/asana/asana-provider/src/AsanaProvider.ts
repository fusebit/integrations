import { Internal } from '@fusebit-int/framework';
import Asana from 'asana';
import Bluebird from "bluebird";

type FusebitAsanaClient = Omit<Asana.Client, 'webhooks'> &
  {
    webhooks: Asana.Client["webhooks"] &
      {
          fusebitCreate?: (resource: string | number, data: any, dispatchOptions?: any) =>  Bluebird<Asana.resources.Webhooks.Type>
      },
    fusebit?: any
  };

export default class AsanaProvider extends Internal.ProviderActivator<FusebitAsanaClient> {
  /*
   * This function will create an authorized wrapper of the Asana SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitAsanaClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitAsanaClient = Asana.Client.create().useAccessToken(credentials.access_token);

    const params = ctx.state.params;
    const webhookUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}/api/fusebit_webhook_event`;


    client.webhooks.fusebitCreate = (resource: string | number, data: any, dispatchOptions?: any): Bluebird<Asana.resources.Webhooks.Type> => {
      return client.webhooks.create(resource, webhookUrl, data, dispatchOptions)
          .then(response => Bluebird.resolve(response))
        .catch(error => Bluebird.reject(error));
    }

    client.fusebit = { credentials };
    return client;
  }
}
