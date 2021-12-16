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
      (url: string) => {
        const parsed = new URL(`https://api.zoom.us/v2/${url}`);
        return parsed.toString();
      },
      this.fusebit.connectorId,
      this.fusebit.credentials.access_token
    );
  }
}
