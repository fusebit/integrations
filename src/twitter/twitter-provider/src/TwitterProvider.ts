import { Internal } from '@fusebit-int/framework';
import TwitterApi, { TwitterApiv2 } from 'twitter-api-v2';

type FusebitTwitterClient = TwitterApiv2 & { fusebit?: any };

export default class TwitterProvider extends Internal.Provider.Activator<FusebitTwitterClient> {
  /*
   * This function will create an authorized wrapper of the Twitter SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitTwitterClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const twitterClient = new TwitterApi(credentials.access_token);

    const client: FusebitTwitterClient = twitterClient.v2;

    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };
    return client;
  }
}
