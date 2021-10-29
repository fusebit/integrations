import { Internal } from '@fusebit-int/framework';
import { WebClient } from '@slack/web-api';

type FusebitWebClient = WebClient & { fusebit?: any };

export default class SlackProvider extends Internal.ProviderActivator<FusebitWebClient> {
  /*
   * This function will create an authorized wrapper of the Slack SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitWebClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitWebClient = new WebClient(credentials.access_token);
    client.fusebit = { credentials };
    return client;
  }
}
