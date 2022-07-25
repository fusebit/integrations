import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';

class BasicAuthClient extends Internal.Provider.ApiClient {
  protected addAuthorization = (request: superagent.Request) => {
    const auth = Buffer.from(`${this.token}:`).toString('base64');
    request.set('Authorization', `Basic ${auth}`);
    request.set('Accept', 'application/json');
    return request;
  };
}

export default BasicAuthClient;
