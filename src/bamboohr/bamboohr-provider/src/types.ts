import { Types } from '@fusebit-int/bamboohr-connector';
import { Internal } from '@fusebit-int/framework';

import BasicAuthClient from './BasicAuthClient';

export interface IBambooHRWebhookList {
  webhooks: Omit<Types.IBambooHRWebhookResponse, 'privateKey'>[];
}

export type FusebitBambooHRClient = BasicAuthClient & { fusebit?: Internal.Types.IFusebitCredentials };
