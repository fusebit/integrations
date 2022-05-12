import { Internal } from '@fusebit-int/framework';
import MailchimpClient from './MailchimpClient';

type FusebitMailchimpClient = MailchimpClient & { fusebit?: Internal.Types.IFusebitCredentials };

export default class MailchimpProvider extends Internal.Provider.Activator<FusebitMailchimpClient> {
  /*
   * This function will create an authorized wrapper of the Mailchimp SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMailchimpClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client = new MailchimpClient(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });

    // We need to fetch the server prefix to initialize the client.
    await client.configureMarketingApi();

    return client;
  }
}
