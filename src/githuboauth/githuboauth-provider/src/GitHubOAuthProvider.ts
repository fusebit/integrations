import { Internal } from '@fusebit-int/framework';
import { Octokit as Client } from 'octokit';

type FusebitGitHubOAuthClient = Client & { fusebit?: any };

export default class GitHubOAuthProvider extends Internal.Provider.Activator<FusebitGitHubOAuthClient> {
  /*
   * This function will create an authorized wrapper of the GitHubOAuth SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitGitHubOAuthClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitGitHubOAuthClient = new Client({ auth: credentials.access_token });
    client.fusebit = { credentials };
    return client;
  }
}
