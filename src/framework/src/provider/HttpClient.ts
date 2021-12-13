import superagent from 'superagent';

type MakeUrl = (baseUrl: string) => string;

export class HttpClient {
  protected makeUrl: MakeUrl;
  public token: string;
  public connectorId: string;

  protected makeRequest = (verb: string) => async (url: string, body?: any) =>
    (
      await (superagent as any)
        [verb](this.makeUrl(url))
        .set('User-Agent', `fusebit/${this.connectorId}`)
        .set('Authorization', `Bearer ${this.token}`)
        .send(body)
    ).body;

  public get: (url: string) => Promise<any>;
  public put: (url: string, body?: any) => Promise<any>;
  public post: (url: string, body?: any) => Promise<any>;
  public delete: (url: string, body?: any) => Promise<any>;
  public head: (url: string, body?: any) => Promise<any>;
  public patch: (url: string, body?: any) => Promise<any>;

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
