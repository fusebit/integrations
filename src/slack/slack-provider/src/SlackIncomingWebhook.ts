import { Internal } from '@fusebit-int/framework';
import superagent from 'superagent';

export class SlackIncomingWebhook extends Internal.Provider.IncomingWebhookClient {
  public send = async (data: any): Promise<any> => {
    const response = await superagent.post(this.ctx.req.body.data.response_url).send(data);
    return response.body;
  };
}
