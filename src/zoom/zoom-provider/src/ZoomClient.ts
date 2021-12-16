import { Internal } from '@fusebit-int/framework';

export interface IZoomCredentials {
  access_token: string;
}

export interface IZoomConfiguration {
  connectorId: string;
  credentials: IZoomCredentials;
}

export class ZoomClient {
  constructor(public fusebit: IZoomConfiguration) {}

  public v2() {
    return new Internal.Provider.ApiClient(
      () => {
        return 'https://api.zoom.us/v2';
      },
      this.fusebit.connectorId,
      this.fusebit.credentials.access_token
    );
  }
}
