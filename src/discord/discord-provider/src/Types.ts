export interface IApiClient {
  get: (url: string) => Promise<any>;
  put: (url: string) => Promise<any>;
  post: (url: string) => Promise<any>;
  delete: (url: string) => Promise<any>;
  head: (url: string) => Promise<any>;
  patch: (url: string) => Promise<any>;
}
export interface IFusebitCredentials {
  credentials: { access_token: string };
  lookupKey: string;
  connectorId: string;
}
export interface IBotCheck {
  hasBotScope: boolean;
  botToken: string;
}
export interface IDiscordMethods {
  get(resource: string, body: any): Promise<any>;
  post(resource: string, body: any): Promise<any>;
  patch(resource: string, body: any): Promise<any>;
  delete(resource: string, body: any): Promise<any>;
  put?(resource: string, body: any): Promise<any>;
  head?(resource: string, body: any): Promise<any>;
  options?(resource: string, body: any): Promise<any>;
}

export enum AuthorizationType {
  Bearer = 'Bearer',
  Bot = 'Bot',
}
