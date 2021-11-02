import { Internal } from '@fusebit-int/framework';
import { Octokit as Client } from 'octokit';

type FusebitGitHubClient = Client & { fusebit?: any };

export default class GitHubProvider extends Internal.ProviderActivator<FusebitGitHubClient> {
  /*
   * This function will create an authorized wrapper of the GitHub SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitGitHubClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitGitHubClient = new Client({ auth: credentials.access_token });
    client.fusebit = { credentials };
    return client;
  }
}
