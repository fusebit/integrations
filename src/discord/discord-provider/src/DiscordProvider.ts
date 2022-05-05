import { REST } from '@discordjs/rest';
import { Internal } from '@fusebit-int/framework';

type FusebitDiscordClient = REST & { fusebit?: any };

export default class DiscordProvider extends Internal.Provider.Activator<FusebitDiscordClient> {
  /*
   * This function will create an authorized wrapper of the Discord SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitDiscordClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitDiscordClient = new REST({ version: '10' }).setToken(credentials.access_token);
    client.fusebit = credentials;
    return client;
  }
}
