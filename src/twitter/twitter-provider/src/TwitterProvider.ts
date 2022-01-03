import { Internal } from '@fusebit-int/framework';
import { TwitterClient as Client } from 'twitter-api-v2';

type FusebitTwitterClient = Client & { fusebit?: any };

export default class TwitterProvider extends Internal.ProviderActivator<FusebitTwitterClient> {
  /*
   * This function will create an authorized wrapper of the Twitter SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitTwitterClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitTwitterClient = new Client({ accessToken: credentials.access_token });
    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };
    return client;
  }
}
