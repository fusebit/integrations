import { Internal } from '@fusebit-int/framework';
import { StackOverflowClient as Client } from './StackOverflowClient';

type FusebitStackOverflowClient = Client & { fusebit?: any };

export default class StackOverflowProvider extends Internal.Provider.Activator<FusebitStackOverflowClient> {
  /*
   * This function will create an authorized wrapper of the StackOverflow SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitStackOverflowClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitStackOverflowClient = new Client({ accessToken: credentials.access_token });
    client.fusebit = { credentials };
    return client;
  }
}
