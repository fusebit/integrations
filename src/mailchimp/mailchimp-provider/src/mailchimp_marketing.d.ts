import * as mailchimpMarketing from '@mailchimp/mailchimp_marketing';

// Extends the Mailchimp marketing API typings since webhooks are not covered

declare module '@mailchimp/mailchimp_marketing' {
  // The events that can trigger the webhook and whether they are enabled.
  export interface IMailchimpWebhookEvents {
    subscribe: boolean;
    unsubscribe: boolean;
    profile: boolean;
    cleaned: boolean;
    upemail: boolean;
    campaign: boolean;
  }

  // The possible sources of any events that can trigger the webhook and whether they are enabled.
  export interface IMailchimpWebhookSources {
    user: boolean;
    admin: boolean;
    api: boolean;
  }

  export interface IMailChimpWebhook {
    list_id: string;
    events: IMailchimpWebhookEvents;
    sources: IMailchimpWebhookSources;
    secret?: string;
    url: string;
  }

  export interface IMailChimpWebhookResponse extends IMailChimpWebhook {
    id: string;
    url: string;
    _links: [];
  }

  export interface ILists {
    id: string;
    web_id: number;
    name: string;
    contact: any;
  }

  export interface IListResponse {
    total_items: number;
    lists: ILists[];
  }

  export interface IMailchimpWebhookList {
    webhooks: IMailChimpWebhookResponse[];
  }

  export namespace lists {
    function createListWebhook(
      listId: string,
      data: { url: string; events: IMailchimpWebhookEvents; sources: IMailchimpWebhookSources }
    ): Promise<IMailChimpWebhookResponse>;

    function getListWebhook(listId: string, webhookId: string): Promise<IMailChimpWebhook>;

    function getListWebhooks(listId: string): Promise<IMailchimpWebhookList>;

    function deleteListWebhook(listId: string, webhookId: string): Promise<void>;

    function getAllLists(): Promise<IListResponse>;
  }
}
