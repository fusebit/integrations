import superagent from 'superagent';

const removeLeadingSlash = (s: string) => s.replace(/^\/(.+)$/, '$1');
const removeTrailingSlash = (s: string) => s.replace(/^(.+)\/$/, '$1');

type Entries<T extends Record<string, any>> = [keyof T, any][];

export interface ITokenParams {
  accountId: string;
  subscriptionId: string;
  baseUrl: string;
  accessToken: string;
}

export const ObjectEntries = <T>(obj: T): Entries<T> => {
  return Object.entries(obj) as Entries<T>;
};

export default abstract class Token<IToken> {
  protected readonly baseUrl: string;
  // This token is a Fusebit token, not a external SaaS token
  protected readonly accessToken: string;

  constructor(params: ITokenParams) {
    this.baseUrl = params.baseUrl;
    this.accessToken = params.accessToken;
  }

  protected cleanId = (id?: string) => (id ? removeTrailingSlash(removeLeadingSlash(id)) : '');
  protected getUrl = (id: string) => `${this.baseUrl}/${this.cleanId(id)}`;

  public abstract get(id: string): Promise<IToken>;
  public abstract put(token: IToken, id: string): Promise<IToken>;
  public abstract error(error: { error: string; errorDescription?: string }, sessionId: string): Promise<void>;
  public abstract delete(identityId: string): Promise<void>;

  public list = async (query: { count?: number; next?: string; idPrefix?: string } = {}) => {
    ObjectEntries(query).forEach(([key, value]) => {
      if (value === undefined) {
        delete query[key];
      }
    });
    const response = await superagent.get(this.baseUrl).query(query).set('Authorization', `Bearer ${this.accessToken}`);
    return response.body;
  };
}

export { Token };
