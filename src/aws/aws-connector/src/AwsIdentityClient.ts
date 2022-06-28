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

class TokenSessionClient<IAwsToken> extends Internal.Provider.TokenClient<IToken> {
  protected createTags: ICreateTags<IAwsToken>;
  protected validateToken: IValidateToken<IAwsToken>;

  constructor(params: ITokenSessionParams<IAwsToken>) {
    super(params);
  }

  public put = async (token: IAwsToken, sessionId: string): Promise<IAwsToken> => {
    return token;
  };
}
