import { Internal } from '@fusebit-int/framework';
import Client from 'snoowrap';

type FusebitRedditClient = Client & { fusebit?: any };

export default class RedditProvider extends Internal.ProviderActivator<FusebitRedditClient> {
  /*
   * This function will create an authorized wrapper of the Reddit SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitRedditClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitRedditClient = new Client({ accessToken: credentials.access_token, userAgent: 'Fusebit' });
    client.fusebit = { credentials };
    return client;
  }
}
