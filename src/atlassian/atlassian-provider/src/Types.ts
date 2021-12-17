export interface IAtlassianMe {
  account_type: string;
  account_id: string;
  email: string;
  name: string;
  picture: string;
  account_status: string;
  nickname: string;
  zoneinfo: string;
  locale: string;
  extended_profile: Record<string, string>;
}

export interface IAtlassianAccessibleResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
}

export type IAtlassianAccessibleResources = IAtlassianAccessibleResource[];

export interface IWebhookDetail {
  jqlFilter: string;
  events: string[];
  fieldIdsFilter?: string[];
  issuePropertyKeysFilter?: string[];
}

export interface IFullWebhookDetail extends IWebhookDetail {
  id: number;
  expirationDate: string;
}

export interface IListWebhookResult {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: IFullWebhookDetail[];
}

export interface IWebhookRegisterResult {
  createdWebhookId: number;
}

export type IWebhookRegisterFailed = { errors: string[] };
export type IWebhookRegisterResponse = IWebhookRegisterResult | IWebhookRegisterFailed;

export interface IWebhookRegisterResponses {
  webhookRegistrationResult: IWebhookRegisterResponse[];
}
