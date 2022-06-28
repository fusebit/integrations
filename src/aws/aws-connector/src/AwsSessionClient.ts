import superagent from 'superagent';

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

export default class TokenSessionClient<IToken> extends Internal.Provider.TokenClient<IToken> {
  private createTags: ICreateTags<IToken>;
  private validateToken: IValidateToken<IToken>;
  constructor(params: ITokenSessionParams<IToken>) {
    super(params);
    this.validateToken = params.validateToken;
    this.createTags = params.createTags;
  }

  public put = async (token: IToken, sessionId: string): Promise<IToken> => {
    const response = await superagent
      .put(this.getUrl(sessionId))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send({ output: { token }, tags: this.createTags(token) });
    return response.body;
  };

  public get = async (sessionId: string): Promise<IToken> => {
    const response = await superagent
      .get(this.getUrl(sessionId))
      .set('Authorization', `Bearer ${this.accessToken}`)
      .send();

    return response.body.output.token;
  };

  public delete = async (sessionId: string): Promise<void> => {
    await superagent.delete(this.getUrl(sessionId)).set('Authorization', `Bearer ${this.accessToken}`).send();
  };

  public error = async (error: { error: string; errorDescription?: string }, sessionId: string) => {};
}
