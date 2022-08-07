import { Types } from '@fusebit-int/bamboohr-connector';
import { Internal } from '@fusebit-int/framework';

import BambooHRWebhook from './BambooHRWebhook';
import BasicAuthClient from './BasicAuthClient';
import { FusebitBambooHRClient } from './types';

export default class BambooHRProvider extends Internal.Provider.Activator<FusebitBambooHRClient> {
  /*
   * This function will create an authorized wrapper of the BambooHR SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitBambooHRClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const { apiKey, companyDomain } = (credentials as unknown) as Types.BambooHRToken;
    const client: FusebitBambooHRClient = new BasicAuthClient(
      (url: string) => `https://api.bamboohr.com/api/gateway.php/${companyDomain}/v1/${url}`,
      credentials.connectorId,
      apiKey
    );

    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };

    return client;
  }

  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new BambooHRWebhook(ctx, lookupKey, installId, this.config, client);
  };
}
