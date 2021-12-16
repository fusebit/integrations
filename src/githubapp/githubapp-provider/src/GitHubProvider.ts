import { Internal } from '@fusebit-int/framework';
import { GitHubClient } from './GitHubClient';

export default class GitHubProvider extends Internal.Provider.Activator<GitHubClient> {
  /*
   * This function will create an authorized wrapper of the GitHub SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<GitHubClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client = new GitHubClient(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });

    return client;
  }
}
