import { Internal } from '@fusebit-int/framework';
import { CalendlyClient as Client } from './CalendlyClient';

type FusebitCalendlyOAuthClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class CalendlyOAuthProvider extends Internal.Provider.Activator<FusebitCalendlyOAuthClient> {
  /*
   * This function will create an authorized wrapper of the CalendlyOAuth SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitCalendlyOAuthClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitCalendlyOAuthClient = new Client({
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
