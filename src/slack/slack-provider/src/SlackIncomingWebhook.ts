import { Internal } from '@fusebit-int/framework';
import { IncomingWebhook, IncomingWebhookResult, IncomingWebhookSendArguments } from '@slack/webhook';

export class SlackIncomingWebhook extends Internal.Provider.IncomingWebhookClient {
  public send = async (data: string | IncomingWebhookSendArguments): Promise<IncomingWebhookResult> => {
    const webhook = new IncomingWebhook(this.ctx.req.body.data.response_url);
    return await webhook.send(data);
  };
}
