import { Internal } from '@fusebit-int/framework';
import { CalendlyClient as Client } from './CalendlyClient';

type FusebitCalendlyClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class CalendlyProvider extends Internal.Provider.Activator<FusebitCalendlyClient> {
  /*
   * This function will create an authorized wrapper of the Calendly SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitCalendlyClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitCalendlyClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
