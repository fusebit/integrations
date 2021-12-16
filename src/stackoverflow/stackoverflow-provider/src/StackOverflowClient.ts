import { Internal } from '@fusebit-int/framework';

export interface IStackOverflowCredentials {
  access_token: string;
  application_key: string;
}

export interface IStackOverflowConfiguration {
  connectorId: string;
  credentials: IStackOverflowCredentials;
}

export class StackOverflowClient {
  public fusebit: IStackOverflowConfiguration;
  constructor(fusebit: IStackOverflowConfiguration) {
    this.fusebit = fusebit;
  }

  public site(siteName: string) {
    return new Internal.Provider.ApiClient(
      (url: string) => {
        const parsed = new URL(`https://api.stackexchange.com/2.3${url}`);
        parsed.searchParams.set('site', siteName);
        parsed.searchParams.set('key', this.fusebit.credentials.application_key);
        parsed.searchParams.set('access_token', this.fusebit.credentials.access_token);

        return parsed.toString();
      },
      this.fusebit.connectorId,
      this.fusebit.credentials.access_token
    );
  }

  public network() {
    return new Internal.Provider.ApiClient(
      (url: string) => {
        const parsed = new URL(`https://api.stackexchange.com/2.3${url}`);
        parsed.searchParams.set('key', this.fusebit.credentials.application_key);
        parsed.searchParams.set('access_token', this.fusebit.credentials.access_token);
        return parsed.toString();
      },
      this.fusebit.connectorId,
      this.fusebit.credentials.access_token
    );
  }
}
