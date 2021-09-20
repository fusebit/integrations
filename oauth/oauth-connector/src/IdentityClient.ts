import superagent from 'superagent';
import { ObjectEntries } from './Utilities';
import { Internal } from '@fusebit-int/framework';
import Context = Internal.Types.Context;
import { IIdentityClientParams, IOAuthToken, ITags } from './OAuthTypes';

const removeLeadingSlash = (s: string) => s.replace(/^\/(.+)$/, '$1');
const removeTrailingSlash = (s: string) => s.replace(/^(.+)\/$/, '$1');

class IdentityClient {
  private readonly params: any;
  private readonly baseUrl: string;
  private readonly connectorUrl: string;
  private readonly functionUrl: URL;
  private readonly accessToken: string;
  private readonly connectorId: string;
  private readonly createTags: (token: IOAuthToken) => Promise<ITags | undefined>;

  constructor(params: IIdentityClientParams) {
    this.params = params;
    this.functionUrl = new URL(params.baseUrl);
    this.connectorId = params.entityId;
    this.connectorUrl = `${this.functionUrl.protocol}//${this.functionUrl.host}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.connectorId}`;
    this.baseUrl = `${this.connectorUrl}/identity`;
    this.accessToken = params.accessToken;
    this.createTags = params.createTags;
  }

  private cleanId = (id?: string) => {
    return id ? removeTrailingSlash(removeLeadingSlash(id)) : '';
  };

  private getUrl = (identityId: string) => {
    identityId = this.cleanId(identityId);
    return `${this.baseUrl}/${identityId}`;
  };

  public getToken = async (identityId: string) => {
    identityId = this.cleanId(identityId);
    const response = await superagent
      .get(this.getUrl(identityId))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .ok((res) => res.status < 300 || res.status === 404);
    return response.status === 404 ? undefined : response.body.data.token;
  };

  public saveTokenToSession = async (token: IOAuthToken, sessionId: string) => {
    if (!token.access_token && !token.refresh_token) {
      const error = (token as { error?: string }).error;
      const errorMessageString = error ? `"${error}". ` : '';
      throw new Error(
        `${errorMessageString}Access token and Refresh token are both missing on object: ${JSON.stringify(
          Object.keys(token)
        )}`
      );
    }

    sessionId = this.cleanId(sessionId);
    const response = await superagent
      .put(`${this.connectorUrl}/session/${sessionId}`)
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send({ output: { token }, tags: await this.createTags(token) });
    return response.body;
  };

  public loadTokenFromSession = async (sessionId: string) => {
    sessionId = this.cleanId(sessionId);
    const response = await superagent
      .get(`${this.connectorUrl}/session/${sessionId}`)
      .set('Authorization', `Bearer ${this.accessToken}`);
    return response.body.output.token;
  };

  public updateToken = async (token: IOAuthToken, lookup: string) => {
    lookup = this.cleanId(lookup);
    const response = await superagent
      .put(this.getUrl(lookup))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send({ output: { token } });
    return response.body;
  };

  public delete = async (identityId: string) => {
    identityId = this.cleanId(identityId);
    await superagent
      .delete(this.getUrl(identityId))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .ok((res) => res.status === 404 || res.status === 204);
    return;
  };

  public list = async (query: { count?: number; next?: string; idPrefix?: string } = {}) => {
    ObjectEntries(query).forEach(([key, value]) => {
      if (value === undefined) {
        delete query[key];
      }
    });
    const response = await superagent.get(this.baseUrl).query(query).set('Authorization', `Bearer ${this.accessToken}`);
    return response.body;
  };

  public saveErrorToSession = async (error: { error: string; errorDescription?: string }, sessionId: string) => {
    sessionId = this.cleanId(sessionId);
    const response = await superagent
      .put(`${this.connectorUrl}/session/${sessionId}`)
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send({ output: error });
    return response.body;
  };

  public getCallbackUrl = async (ctx: Context): Promise<string> => {
    const url = new URL(`${this.connectorUrl}/session/${ctx.query.state}/callback`);
    Object.entries<string>(ctx.request.query).forEach(([key, value]) => url.searchParams.append(key, value));
    return url.toString();
  };
}

export default IdentityClient;
