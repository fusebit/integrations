import superagent from 'superagent';

type MakeUrl = (baseUrl: string) => string;

export class ApiClient {
  protected makeUrl: MakeUrl;
  public token: string;
  public connectorId: string;

  protected addAuthorization = (request: superagent.Request) => {
    return request.set('Authorization', `Bearer ${this.token}`);
  };

  protected makeRequest = (verb: string) => async (url: string, body?: any) =>
    (
      await this.addAuthorization(
        (superagent as any)[verb](this.makeUrl(url)).set('User-Agent', `fusebit/${this.connectorId}`)
      ).send(body)
    ).body;

  public get: <T = any>(url: string) => Promise<T>;
  public put: <T = any>(url: string, body?: any) => Promise<T>;
  public post: <T = any>(url: string, body?: any) => Promise<T>;
  public delete: <T = any>(url: string, body?: any) => Promise<T>;
  public head: <T = any>(url: string, body?: any) => Promise<T>;
  public patch: <T = any>(url: string, body?: any) => Promise<T>;

  constructor(makeUrl: MakeUrl, connectorId: string, token: string) {
    this.makeUrl = makeUrl;
    this.connectorId = connectorId;
    this.token = token;
    this.get = this.makeRequest('get');
    this.put = this.makeRequest('put');
    this.post = this.makeRequest('post');
    this.delete = this.makeRequest('delete');
    this.head = this.makeRequest('head');
    this.patch = this.makeRequest('patch');
  }
}
