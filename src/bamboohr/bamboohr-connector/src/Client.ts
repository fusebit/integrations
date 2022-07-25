import superagent from 'superagent';

export interface IOptions {
  apiKey: string;
  companyDomain: string;
}

class Client {
  private apiPath: string;
  private apiKey: string;

  constructor({ apiKey, companyDomain }: IOptions) {
    this.apiPath = `https://api.bamboohr.com/api/gateway.php/${companyDomain}/v1`;
    this.apiKey = apiKey;
  }

  public async makeRequest<T>(verb: string, path: string, entityId: string, body?: any): Promise<T> {
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    return (
      await (superagent as any)
        [verb](`${this.apiPath}/${path}`)
        .set('User-Agent', `fusebit/${entityId}`)
        .set('Authorization', `Basic ${auth}`)
        .send(body)
    ).body;
  }
}

export default Client;
