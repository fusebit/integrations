import { Internal } from '@fusebit-int/framework';
import { Gitlab } from '@gitbeaker/node';

type FusebitGitLabClient = typeof Gitlab & {
  fusebit: Internal.Types.IFusebitCredentials;
};

export default class GitLabProvider extends Internal.Provider.Activator<FusebitGitLabClient> {
  /*
   * This function will create an authorized GitLab APIs object.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitGitLabClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });

    const api = new Gitlab({
      oauthToken: credentials.access_token,
    });

    ((api as unknown) as FusebitGitLabClient).fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };

    return (api as unknown) as FusebitGitLabClient;
  }
}
