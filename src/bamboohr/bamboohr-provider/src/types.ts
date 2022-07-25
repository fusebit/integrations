import { Types } from '@fusebit-int/bamboohr-connector';
import { Internal } from '@fusebit-int/framework';

import BasicAuthClient from './BasicAuthClient';

export interface IBambooHRWebhookList {
  webhooks: Omit<Types.IBambooHRWebhookResponse, 'privateKey'>[];
}

export type FusebitBambooHRClient = BasicAuthClient & { fusebit?: Internal.Types.IFusebitCredentials };

export interface IBambooHRWebhookLog {
  webhookId: number; // I know, in this endpoint, Bamboo, instead of using id, sends webhookId
  url: string;
  lastAttempted: string;
  lastSuccess: string;
  failureCount: number;
  statusCode: number;
  format: string;
  employeeIds: number[];
}

export interface IBambooHRWebhookMonitorField {
  id: number;
  name: string;
  alias: string;
}
