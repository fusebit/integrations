---
to: "<%= !provider.package && includeApiClient ? `src/${name.toLowerCase()}/${name.toLowerCase()}-provider/src/${h.capitalize(name)}Client.ts` : null  %>"
---
import { Internal } from '@fusebit-int/framework';

export class <%= h.capitalize(name) %>Client extends Internal.Provider.ApiClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  private baseUrl = '<%= apiClientBaseUrl %>';

  constructor(fusebit: Internal.Types.IFusebitCredentials) {
    super((url: string) => `${this.baseUrl}${url}`, fusebit.connectorId, fusebit.credentials.access_token);
    this.fusebit = fusebit;
  }
}
