import { Internal } from '@fusebit-int/framework';
import Asana from 'asana';
import Bluebird from "bluebird";
import superagent from "superagent";
import { randomUUID } from 'crypto';

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
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string, installId: string): Promise<FusebitAsanaClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitAsanaClient = Asana.Client.create().useAccessToken(credentials.access_token);
    const params = ctx.state.params;


    client.webhooks.fusebitCreate = (resource: string | number, data: any, dispatchOptions?: any): Bluebird<Asana.resources.Webhooks.Type> => {

      return new Bluebird<Asana.resources.Webhooks.Type>(async (resolve, reject) => {
        try {
          const webhookGuid = randomUUID();
          const webhookTag = encodeURIComponent(['webhook', this.config.entityId, webhookGuid].join('/'));
          const tagUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/integration/${params.entityId}/install/${installId}/tag/${webhookTag}`;
          await superagent.put(tagUrl).set('Authorization', `Bearer ${params.functionAccessToken}`);


          const createWebhookUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}/api/fusebit_webhook_create/${webhookGuid}`;
          await superagent.post(createWebhookUrl).set('Authorization', `Bearer ${params.functionAccessToken}`);;

          const webhookUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}/api/fusebit_webhook_event/${webhookGuid}`;

          await client.webhooks.create(resource, webhookUrl, data, dispatchOptions);
          resolve();
        } catch (e) {
          reject(e);
        }
      });


    }

    client.fusebit = { credentials };
    return client;
  }
}
