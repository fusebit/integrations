import { Internal } from '@fusebit-int/framework';

import { Octokit } from 'octokit';

type FusebitClient = Octokit & { fusebit?: any };

export default class GitHubProvider extends Internal.ProviderActivator<FusebitClient> {
  /*
   * This function will create an authorized wrapper of the GitHub SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });

    const client: FusebitClient = new Octokit({ auth: credentials.access_token });

    // Add the credentials created to the fusebit member for future use.
    client.fusebit = { credentials };

    return client;
  }
}
