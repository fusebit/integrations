interface IOAuthConfig {
  authorizationUrl: string;
  audience?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  vendorPrefix?: string;
  extraParams?: string;
  scope: string;
  accessTokenExpirationBuffer: number;
  refreshErrorLimit: number;
  refreshWaitCountLimit: number;
  refreshInitialBackoff: number;
  refreshBackoffIncrement: number;

  mountUrl: string;
}

interface IOAuthToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope: string;
  expires_at: number;
  status: string;
  timestamp: number;
  refreshErrorCount: number;
  params: Record<string, string>;
}

interface IOAuthTokenWithRefresh extends IOAuthToken {
  refresh_token: string;
}

interface ITags extends Record<string, string | null> {}

interface IIdentityClientParams {
  subscriptionId: string;
  accountId: string;
  baseUrl: string;
  entityId: string;
  accessToken: string;
  createTags: (token: IOAuthToken) => Promise<ITags | undefined>;
}

export { IOAuthConfig, IOAuthToken, ITags, IIdentityClientParams, IOAuthTokenWithRefresh };
