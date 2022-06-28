import superagent from 'superagent';
import { ITags } from './OAuthTypes';
import { Internal } from '@fusebit-int/framework';

type ICreateTags<IToken> = ((token: IToken) => Promise<ITags | undefined>) | ((token: IToken) => ITags | undefined);
type IValidateToken<IToken> = ((token: IToken) => Promise<void>) | ((token: IToken) => void);

interface ITokenParams {
  accountId: string;
  subscriptionId: string;
  baseUrl: string;
  accessToken: string;
}

export interface ITokenSessionParams<IToken> extends ITokenParams {
  createTags: ICreateTags<IToken>;
  validateToken: IValidateToken<IToken>;
}

class TokenSessionClient<IToken> extends Internal.Provider.TokenClient<IToken> {
  protected createTags: ICreateTags<IToken>;
  protected validateToken: IValidateToken<IToken>;

  constructor(params: ITokenSessionParams<IToken>) {
    super(params);
    this.createTags = params.createTags;
    this.validateToken = params.validateToken;
  }

  public put = async (token: IToken, sessionId: string): Promise<IToken> => {
    await this.validateToken(token);

    sessionId = this.cleanId(sessionId);
    const response = await superagent
      .put(this.getUrl(sessionId))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send({ output: { token }, tags: await this.createTags(token) });
    return response.body;
  };

  public get = async (sessionId: string): Promise<IToken> => {
    sessionId = this.cleanId(sessionId);
    const response = await superagent.get(this.getUrl(sessionId)).set('Authorization', `Bearer ${this.accessToken}`);
    if (response.body.output?.token) {
      return response.body.output.token;
    }

    return response.body.input;
  };

  public error = async (error: { error: string; errorDescription?: string }, sessionId: string) => {
    sessionId = this.cleanId(sessionId);
    await superagent
      .put(this.getUrl(sessionId))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send({ output: error });
    return;
  };

  public delete = async (): Promise<void> => {
    // No sensible operation here; do nothing.
  };
}

class TokenIdentityClient<IToken> extends Internal.Provider.TokenClient<IToken> {
  public get = async (identityId: string): Promise<IToken> => {
    identityId = this.cleanId(identityId);
    const response = await superagent
      .get(this.getUrl(identityId))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .ok((res) => res.status < 300 || res.status === 404);
    return response.status === 404 ? undefined : response.body.data.token;
  };

  public put = async (token: IToken, lookup: string): Promise<IToken> => {
    const response = await superagent
      .put(this.getUrl(lookup))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send({ data: { token } });
    return response.body;
  };

  public delete = async (identityId: string) => {
    await superagent
      .delete(this.getUrl(identityId))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .ok((res) => res.status === 404 || res.status === 204);
    return;
  };

  public error = async (): Promise<void> => {
    // No way of recording errors on identities right now.
  };
}

export { TokenSessionClient, TokenIdentityClient };
