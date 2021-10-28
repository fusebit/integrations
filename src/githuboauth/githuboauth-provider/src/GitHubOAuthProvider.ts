import { Internal } from '@fusebit-int/framework';
import { Octokit as Client } from 'octokit';

type FusebitGitHubOAuthClient = Client & { fusebit?: any };

export default class GitHubOAuthProvider extends Internal.ProviderActivator<FusebitGitHubOAuthClient> {
  /*
   * This function will create an authorized wrapper of the GitHubOAuth SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitGitHubOAuthClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitGitHubOAuthClient = new Client({ accessToken: credentials.access_token });
    client.fusebit = { credentials };
    return client;
  }
}
