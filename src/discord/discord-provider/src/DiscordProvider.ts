import { Internal } from '@fusebit-int/framework';
import { REST as Client } from '@discordjs/rest';

type FusebitDiscordClient = Client & { fusebit?: any };

export default class DiscordProvider extends Internal.ProviderActivator<FusebitDiscordClient> {
  /*
   * This function will create an authorized wrapper of the Linear SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitDiscordClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitDiscordClient = new Client({ version: '9' }).setToken(credentials.access_token);
    client.fusebit = { credentials };
    return client;
  }
}
