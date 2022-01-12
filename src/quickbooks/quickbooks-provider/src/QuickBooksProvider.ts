import { Internal } from '@fusebit-int/framework';
const Client = require('node-quickbooks');

type FusebitQuickBooksClient = any & { fusebit?: Internal.Types.IFusebitCredentials };

export default class QuickBooksProvider extends Internal.Provider.Activator<FusebitQuickBooksClient> {
  /*
   * This function will create an authorized wrapper of the QuickBooks SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitQuickBooksClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });

    const params = {
      useSandbox: !!process.env.QUICKBOOKS_USE_SANDBOX,
      debug: !!process.env.QUICKBOOKS_DEBUG,
      token: credentials.access_token,
      realmId: credentials.params?.realmId,
      oauthversion: '2.0',
    };

    console.log(JSON.stringify({ ...params, token: params.token.length }, null, 3));
    const client: FusebitQuickBooksClient = new Client(params);

    const sdk: any = {};

    Object.keys(Object.getPrototypeOf(client)).forEach((fn) => {
      sdk[fn] = async (...params: any[]) => {
        return new Promise((resolve, reject) =>
          client[fn](...params, (e: any, v: any) => {
            if (e) {
              reject(e.fault.error);
            }
            resolve(v);
          })
        );
      };
    });

    sdk.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };

    return sdk;
  }
}
