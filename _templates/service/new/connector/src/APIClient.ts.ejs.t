---
to: "<%= includeConnectorAPIClient ? `src/${name.toLowerCase()}/${name.toLowerCase()}-connector/src/${h.capitalize(name)}Client.ts` : null  %>"
---
import { Internal } from '@fusebit-int/framework';

export class <%= h.capitalize(name) %>Client extends Internal.Provider.ApiClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  private baseUrl = '<%= useProviderAPIClientBaseUrl ? apiClientBaseUrl : connectorAPIClientBaseUrl  %>';
  private webhookUrl: string;

  constructor(fusebit: Internal.Types.IFusebitCredentials) {
    super((url: string) => `${this.baseUrl}${url}`, fusebit.connectorId, fusebit.credentials.access_token);
    this.fusebit = fusebit;
    this.baseUrl = (fusebit.credentials as any).baseUrl;
    this.webhookUrl = `${this.baseUrl}/connector/${ctx.state.params.entityId}/api/fusebit/webhook/event`;
  }
}
