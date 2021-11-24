import { Internal } from '@fusebit-int/framework';
import snoowrap from 'snoowrap';
type FusebitRedditClient = snoowrap & { fusebit?: any };

export default class RedditProvider extends Internal.ProviderActivator<FusebitRedditClient> {
  /*
   * This function will create an authorized wrapper of the Reddit SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitRedditClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitRedditClient = new snoowrap({
      userAgent: 'Fusebit Connector',
      accessToken: credentials.access_token,
    });
    client.fusebit = { credentials };
    return client;
  }
}
