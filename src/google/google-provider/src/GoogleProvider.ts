import { Internal } from '@fusebit-int/framework';
import { google } from 'googleapis';

type FusebitGoogleClient = typeof google & {
  fusebit: Internal.Types.IFusebitCredentials;
};

export default class GoogleProvider extends Internal.Provider.Activator<FusebitGoogleClient> {
  /*
   * This function will create an authorized Google APIs object.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitGoogleClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: credentials.access_token });

    google.options({ auth });
    google.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };

    return google as FusebitGoogleClient;
  }
}
