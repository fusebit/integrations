import { Internal } from '@fusebit-int/framework';
import { FusebitClient } from './types';

import { createApexClass, createApexTestClass, createApexTrigger } from './webhooks-templates';

import superagent from 'superagent';
import { v4 as uuidv4 } from 'uuid';

interface IRemoteSiteSetting {
  fullName: string;
  disableProtocolSecurity: boolean;
  url: string;
  isActive: boolean;
}

interface ICreateWebhookOptions {
  className: string;
  entityId: string;
  events: string[];
}

class SalesforceWebhook extends Internal.Provider.WebhookClient<FusebitClient> {
  /**
   * Register a new Salesforce webhook
   * @param className {string} The Apex class name
   * @param entityId {string} The type of entity you want to register the Webhook (Opportunity, Contract, Contact)
   * @param events {Array<string>} The list of events that trigger the Webhook, Example: ['after insert', 'after update']
   */
  public create = async ({ className, entityId, events }: ICreateWebhookOptions): Promise<any> => {
    const webhookId = uuidv4();
    const webhookSecret = uuidv4();
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookEndpoint = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/event`;
    const createWebhookSecretUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/create-secret`;

    // Register a Webhook secret in Fusebit storage
    const webhookSecretResponse = await superagent
      .post(createWebhookSecretUrl)
      .set('Authorization', `Bearer ${params.functionAccessToken}`)
      .send({
        webhookId,
        secret: webhookSecret,
      });

    // TODO: Validate required fields
    // Creating a Salesforce Webhook involves creating an Apex Class, Apex Trigger and Apex test class.
    const createdClass = await this.client.tooling.sobject('ApexClass').create({
      body: createApexClass(className, entityId.toLowerCase(), webhookSecret, webhookId),
    });

    const createdTestClass = await this.client.tooling.sobject('ApexClass').create({
      body: createApexTestClass({
        testClassName: `${className}Test`,
        webhookClassName: className,
        entityId,
        webhookEndpoint,
      }),
    });

    const createdTrigger = await this.client.tooling.sobject('ApexTrigger').create({
      name: className,
      tableEnumOrId: entityId,
      body: createApexTrigger({
        triggerName: `${className}Trigger`,
        className,
        entityId,
        webhookEndpoint,
        events,
      }),
    });

    return {
      createdTestClass,
      createdTrigger,
      createdClass,
    };
  };

  /**
   * Check if the Apex class is already registered.
   * @param className {string} The Apex class name
   * @returns {boolean}
   */
  public webhookExists = async (className: string): Promise<boolean> => {
    const foundClass = await this.client.tooling.sobject('ApexClass').findOne({
      name: className,
    });
    return !!foundClass;
  };

  /**
   * Enable Remote Site setting for external API calls.
   * @param {object}
   */
  public enableRemoteSiteSetting = async ({
    fullName,
    disableProtocolSecurity = false,
  }: {
    fullName: string;
    disableProtocolSecurity?: boolean;
  }): Promise<any> => {
    const settings: IRemoteSiteSetting = {
      fullName,
      disableProtocolSecurity,
      url: this.ctx.state.params.baseUrl,
      isActive: true,
    };
    return await this.client.metadata.create('RemoteSiteSetting', settings);
  };

  /**
   *
   * @param fullName {string} The remote site settings name for accessing the API.
   */
  public isEnableRemoteSiteSettingEnabled = async (fullName: string): Promise<boolean> => {
    const settings = await this.client.metadata.read('RemoteSiteSetting', fullName);
    return !!settings;
  };

  public get = async (listId: string, webhookId: string): Promise<any> => {};

  public list = async (listId: string): Promise<any> => {};

  public delete = async (listId: string, webhookId: string) => {};

  public deleteAll = async () => {};
}

export default SalesforceWebhook;
