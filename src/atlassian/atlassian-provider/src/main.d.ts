
interface IApiClient {
  get: (url: string) => Promise<any>;
  put: (url: string) => Promise<any>;
  post: (url: string) => Promise<any>;
  delete: (url: string) => Promise<any>;
  head: (url: string) => Promise<any>;
  patch: (url: string) => Promise<any>;
}

interface IFusebitCredentials {
  credentials: { access_token: string };
  lookupKey: string;
  connectorId: string;
}

interface IAtlassianMe {
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

interface IAtlassianAccessibleResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
}

type IAtlassianAccessibleResources = IAtlassianAccessibleResource[];

interface IWebhookDetail {
  jqlFilter: string;
  events: string[];
  fieldIdsFilter?: string[];
  issuePropertyKeysFilter?: string[];
}

interface IWebhookRegisterResult {
  createdWebhookId: number;
}

type IWebhookRegisterFailed = { errors: string[] };
type IWebhookRegisterResponse = IWebhookRegisterResult | IWebhookRegisterFailed;

interface IWebhookRegisterResponses {
  webhookRegistrationResult: IWebhookRegisterResponse[];
}