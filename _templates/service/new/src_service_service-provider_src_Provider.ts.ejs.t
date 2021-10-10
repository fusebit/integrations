---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/src/Provider.ts
---
import { Internal } from '@fusebit-int/framework';

// TODO - Import the client object from the package.
import { Client } from '<%= provider.package %>';

type FusebitWebClient = Client & { fusebit?: any };

export default class <%= h.capitalize(name) %>Provider extends Internal.ProviderActivator<FusebitWebClient> {
  /*
   * This function will create an authorized wrapper of the <%= h.capitalize(name) %> SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitWebClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });

    // TODO - Create the necessary object, add credentials, and return it.
    const client: FusebitWebClient = new Client(credentials.access_token);

    // Add the credentials created to the fusebit member for future use.
    client.fusebit = { credentials };

    return client;
  }
}
