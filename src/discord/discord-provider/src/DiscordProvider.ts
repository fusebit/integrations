import { Internal } from '@fusebit-int/framework';

// DiscordJS REST client requires v16 nodejs, so placing a fake interface here for now
class MockClient {
  fusebit: any;
}

type FusebitDiscordClient = MockClient & { fusebit?: any };

export default class DiscordProvider extends Internal.ProviderActivator<FusebitDiscordClient> {
  /*
   * This function will create an authorized wrapper of the Linear SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitDiscordClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client = new MockClient();
    client.fusebit = { credentials };
    return client;
  }
}
