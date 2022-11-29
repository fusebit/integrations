import { Internal } from '@fusebit-int/framework';

export class CalendlyClient extends Internal.Provider.ApiClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  private baseUrl = 'https://api.calendly.com';

  constructor(fusebit: Internal.Types.IFusebitCredentials) {
    super((url: string) => `${this.baseUrl}${url}`, fusebit.connectorId, fusebit.credentials.access_token);
    this.fusebit = fusebit;
  }
}
