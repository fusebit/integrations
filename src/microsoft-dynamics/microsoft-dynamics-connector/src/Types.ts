export interface IWebhookStepData {
  sdkMessageFilter: string;
  sdkMessage: string;
  stage: string;
}

export interface ICreateWebhokData {
  name: string;
  contract: number;
  authtype: number;
  authvalue: string;
}

export interface ICreateWebhokStepData {
  name: string;
  stage: number;
  rank: number;
  serviceEndpointId: string;
  messageId: string;

  messageFilterId: string;
  supportedDeployment: number;
}

export interface IMicrosoftDynamicsWebhook {
  serviceendpointid: string;
  name: string;
  url: string;
}

export interface ISdkMessageFilter {
  _sdkmessageid_value: string;
  sdkmessagefilterid: string;
}

export interface IWebhookStep {
  stage: number;
  _sdkmessagefilterid_value: string;
  _sdkmessageid_value: string;
  name: string;

  sdkmessageprocessingstepidunique: string;
}
export interface ISdkMessage {
  sdkmessageid: string;
}

export interface ISdkMessageResponse {
  value: Array<ISdkMessage>;
}

export interface ISdkMessageFilterResponse {
  value: Array<ISdkMessageFilter>;
}

export interface IDynamicsApiResponse<T> {
  body: T;
}

export interface ISdkMessageIdResponse {
  sdkMessageId: string;
  sdkMessageFilterId: string;
}

export interface IWebhookStepResponse {
  value: Array<IWebhookStep>;
}
