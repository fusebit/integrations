export type BambooHRToken = {
  apiKey: string;
  companyDomain: string;
};

export interface IBambooHRWebhookFrequency {
  hour?: number;
  minute?: number;
  day?: number;
  month?: number;
}

export interface IBambooHRWebhookLimit {
  times: number;
  seconds: number;
}

export interface IBambooHRWebhook {
  name: string;
  monitorFields: string[];
  postFields: Record<string, any>;
  frequency?: IBambooHRWebhookFrequency;
  limit?: IBambooHRWebhookLimit;
}

export interface IBambooHRWebhookResponse extends IBambooHRWebhook {
  id: number;
  created: string;
  lastSent: string;
  url: string;
  format: string;
  privateKey: string;
}

export interface IWebhookUrlParts {
  webhookId: string;
  eventType: string;
  path: string;
}
