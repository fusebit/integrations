---
to: "<%= includeWebhooks ? `src/${name.toLowerCase()}/${name.toLowerCase()}-provider/src/${h.capitalize(name)}Webhook.ts` : null  %>"
---
import { Internal } from '@fusebit-int/framework';

interface ICreateWebhookProps {}

interface IUpdateWebhookProps {}

interface ICreateWebhookResponse {}

interface IUpdateWebhookResponse {}

interface IWebhookGetResponse {}


interface IDeleteWebhookResponse {}

class <%= h.capitalize(name) %>Webhook extends Internal.Provider.WebhookClient {
  
  public create = async (props: ICreateWebhookProps): Promise<ICreateWebhookResponse> => {
    return this.makeConnectorWebhookRequest<ICreateWebhookResponse>('post')(`${this.lookupKey}`, props);
  };


  public update = async (id: number, props: IUpdateWebhookProps): Promise<IUpdateWebhookResponse> => {
    return this.makeConnectorWebhookRequest<IUpdateWebhookResponse>('put')(`${this.lookupKey}/${id}`, props);
  };


  public get = async (id: number): Promise<IWebhookGetResponse> => {
    return this.makeConnectorWebhookRequest<IWebhookGetResponse>('get')(`${this.lookupKey}/${id}`);
  };


  public list = async (): Promise<IWebhookGetResponse[]> => {
    return this.makeConnectorWebhookRequest<IWebhookGetResponse[]>('get')(`${this.lookupKey}/webhooks`);
  };


  public delete = async (id: number): Promise<IDeleteWebhookResponse> => {
    return this.makeConnectorWebhookRequest<IDeleteWebhookResponse>('delete')(`${this.lookupKey}/${id}`);
  };

  public deleteAll = async () => {
    const webhookList = await this.list();
    await Promise.all(webhookList.map(async (webhook) => this.delete(webhook.id)));
  };
}

export default <%= h.capitalize(name) %>Webhook;

