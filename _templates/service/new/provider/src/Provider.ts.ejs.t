---
to: src/<%=name.toLowerCase()%>/<%=name.toLowerCase()%>-provider/src/<%=h.capitalize(name)%>Provider.ts
---
import { Internal } from '@fusebit-int/framework';
import { <%= h.capitalize(name) %>Client as Client } from '<%= provider.package ? provider.package : `./${h.capitalize(name)}Client`  %>';

type Fusebit<%= h.capitalize(name) %>Client = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class <%= h.capitalize(name) %>Provider extends Internal.Provider.Activator<Fusebit<%= h.capitalize(name) %>Client> {
  /*
   * This function will create an authorized wrapper of the <%= h.capitalize(name) %> SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<Fusebit<%= h.capitalize(name) %>Client> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: Fusebit<%= h.capitalize(name) %>Client = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
