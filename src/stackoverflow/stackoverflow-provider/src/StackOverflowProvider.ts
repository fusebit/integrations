import { Internal } from '@fusebit-int/framework';
import {
  StackOverflowClient as Client,
  IStackOverflowConfiguration,
  IStackOverflowCredentials,
} from './StackOverflowClient';

type FusebitStackOverflowClient = Client & { fusebit?: IStackOverflowConfiguration };

export default class StackOverflowProvider extends Internal.Provider.Activator<FusebitStackOverflowClient> {
  /*
   * This function will create an authorized wrapper of the StackOverflow SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitStackOverflowClient> {
    const credentials = ((await this.requestConnectorToken({ ctx, lookupKey })) as any) as IStackOverflowCredentials;
    const client: FusebitStackOverflowClient = new Client({ connectorId: this.config.entityId, credentials });

    return client;
  }
}
