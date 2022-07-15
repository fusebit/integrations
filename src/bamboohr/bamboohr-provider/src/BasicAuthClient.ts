import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';

class BasicAuthClient extends Internal.Provider.ApiClient {
  protected addAuthorization = (request: superagent.Request) => {
    const auth = Buffer.from(`${this.token}:`).toString('base64');
    return request.set('Authorization', `Basic ${auth}`);
  };
}

export default BasicAuthClient;
