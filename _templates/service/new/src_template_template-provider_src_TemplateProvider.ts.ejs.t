---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/src/<%= h.capitalize(name) %>Provider.ts
---
import { Internal } from '@fusebit-int/framework';
import { <%= h.capitalize(name) %>Client as Client } from '<%= provider.package %>';

type FusebitTemplateClient = Client & { fusebit?: any };

export default class <%= h.capitalize(name) %>Provider extends Internal.ProviderActivator<FusebitTemplateClient> {
  /*
   * This function will create an authorized wrapper of the <%= h.capitalize(name) %> SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitTemplateClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitTemplateClient = new Client({ accessToken: credentials.access_token });
    client.fusebit = { credentials };
    return client;
  }
}