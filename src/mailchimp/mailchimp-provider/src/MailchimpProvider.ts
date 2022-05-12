import { Internal } from '@fusebit-int/framework';
import { MailchimpClient as Client } from '@mailchimp/mailchimp_marketing';

type FusebitMailchimpClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class MailchimpProvider extends Internal.Provider.Activator<FusebitMailchimpClient> {
  /*
   * This function will create an authorized wrapper of the Mailchimp SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMailchimpClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitMailchimpClient = new Client({ accessToken: credentials.access_token });
    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };
    return client;
  }
}
