import jsforce, { FileProperties, MetadataInfo, RecordResult, SaveResult } from 'jsforce';
import { v4 as uuidv4 } from 'uuid';
import { Connector } from '@fusebit-int/framework';

import { createApexClass, createApexTestClass, createApexTrigger } from './apex';

export interface IOptions {
  ctx: Connector.Types.Context;
  accessToken: string;
  instanceUrl: string;
}

export interface INewWebhookOptions {
  entityId: string;
  events: string[];
}

export interface IRemoteSiteSetting {
  fullName: string;
  disableProtocolSecurity: boolean;
  url: string;
  isActive: boolean;
  description?: string;
}

class WebhookManager {
  private client: jsforce.Connection;
  private ctx: Connector.Types.Context;
  private apexIdentifier: string;
  private baseUrl: string;
  private webhookEndpoint: string;
  private webhookClassName: string;
  private webhookTestClassName: string;

  constructor({ ctx, accessToken, instanceUrl }: IOptions) {
    const { endpoint, accountId, subscriptionId, entityId } = ctx.state.params;
    this.ctx = ctx;
    const subscriptionIdentifier = subscriptionId.split('sub-')[1];
    this.apexIdentifier = `Sub_${subscriptionIdentifier}`;
    this.webhookClassName = `Webhook_${this.apexIdentifier}`;
    this.webhookTestClassName = `Test_${this.webhookClassName}`;
    this.baseUrl = `${endpoint}/v2/account/${accountId}/subscription/${subscriptionId}`;
    this.webhookEndpoint = `${this.baseUrl}/connector/${entityId}/api/fusebit/webhook/event`;
    this.client = new jsforce.Connection({
      accessToken,
      instanceUrl,
    });
  }

  private async createOrUpdateApexClass(className: string, content: string): Promise<RecordResult> {
    const apexClass = await this.getClass(className);
    if (apexClass) {
      await this.client.tooling.sobject('ApexClass').delete(apexClass.Id);
    }
    return await this.client.tooling.sobject('ApexClass').create({
      body: content,
    });
  }

  /**
   * Check if the Apex class is already registered.
   * @param className {string} The Apex class name
   * @returns {boolean}
   */
  public getClass = async (className: string): Promise<any> => {
    const foundClass = await this.client.tooling.sobject('ApexClass').findOne({
      name: className,
    });
    return foundClass;
  };

  /**
   * Enable Remote Site setting for external API calls.
   * @param {object}
   */
  public enableRemoteSiteSetting = async ({
    fullName,
    url,
    description,
    disableProtocolSecurity = false,
  }: {
    fullName: string;
    url: string;
    description: string;
    disableProtocolSecurity?: boolean;
  }): Promise<any> => {
    const settings: IRemoteSiteSetting = {
      fullName,
      disableProtocolSecurity,
      url,
      isActive: true,
      description,
    };
    return await this.client.metadata.create('RemoteSiteSetting', settings);
  };

  public async getNamespace(): Promise<string> {
    const namespaceResult = await this.client.query('SELECT NamespacePrefix FROM Organization');
    return (namespaceResult.records && (namespaceResult.records as any)[0].NamespacePrefix) || '';
  }

  /**
   *
   * @param fullName {string} The remote site settings name for accessing the API.
   */
  public isEnableRemoteSiteSettingEnabled = async (fullName: string): Promise<boolean> => {
    let settings = await this.client.metadata.list([{ type: 'RemoteSiteSetting' }]);
    if (settings.length) {
      return !!settings.filter((setting) => setting.fullName === fullName).length;
    }
    return settings && (settings as any).fullName === fullName;
  };

  public customObjectExists = async (fullName: string): Promise<boolean> => {
    const settings = await this.client.metadata.read('CustomObject', fullName);
    return !!(settings as MetadataInfo).fullName;
  };

  public customMetadataExists = async (fullName: string, fieldName: string): Promise<boolean> => {
    const settings = await this.client.query(`Select ${fieldName} FROM ${fullName}`);
    return !!settings.totalSize;
  };

  public async prepareSalesforceInstanceForWebhooks(webhookId: string): Promise<Record<string, string>> {
    // 1. Ensure RemoteSiteSettings is enabled for the domain
    const remoteSiteSettingName = `WebhookSettings_${this.apexIdentifier}`;
    const namespace = await this.getNamespace();
    const webhookSecretMetadataField = `${namespace}__${this.apexIdentifier}`;
    const webhookSecretMetadata = `${webhookSecretMetadataField}__mdt`;
    const webhookSecretMetadataValue = `${namespace}__secret__c`;
    const webhookSecretMetadataFieldReference = `${webhookSecretMetadataField}.Webhook_secret`;
    const webhookSecret = uuidv4();

    const isEnableRemoteSiteSettingEnabled = await this.isEnableRemoteSiteSettingEnabled(remoteSiteSettingName);

    if (!isEnableRemoteSiteSettingEnabled) {
      const remoteSiteSettingsResponse = await this.enableRemoteSiteSetting({
        fullName: remoteSiteSettingName,
        url: this.ctx.state.params.baseUrl,
        description: 'Automatically generated to allow Salesforce Webhooks',
      });

      if (!remoteSiteSettingsResponse.success) {
        this.ctx.throw(400, `Failed to enable remote site settings for ${this.ctx.state.params.baseUrl}`);
      }
    }

    // 2. Ensure metadata for storing the Webhook is created

    // 2.1 Configure Custom Metadata Type
    const customObjectExists = await this.customObjectExists(webhookSecretMetadata);
    if (!customObjectExists) {
      const customObjectResponse = await this.client.metadata.create('CustomObject', {
        fullName: webhookSecretMetadata,
        //@ts-ignore
        label: 'Webhook configuration',
        pluralLabel: 'Webhook configuration',
        visibility: 'PackageProtected',
        fields: [
          {
            fullName: webhookSecretMetadataValue,
            businessStatus: 'Hidden',
            caseSensitive: 'false',
            externalId: 'false',
            fieldManageability: 'DeveloperControlled',
            label: 'Webhook Secret',
            length: '36',
            required: 'true',
            securityClassification: 'MissionCritical',
            type: 'Text',
            unique: 'true',
          },
        ],
      });

      if (!(customObjectResponse as SaveResult).success) {
        this.ctx.throw(400, `Failed to create CustomObject ${webhookSecretMetadata}`);
      }
    }

    // 2.3 Configure Webhook secret field and value
    const customMetadataExists = await this.customMetadataExists(webhookSecretMetadata, webhookSecretMetadataValue);
    if (!customMetadataExists) {
      const customMetadataResponse = await this.client.metadata.create('CustomMetadata', {
        fullName: webhookSecretMetadataFieldReference,
        //@ts-ignore
        label: 'Webhook secret',
        protected: 'true',
        values: {
          field: webhookSecretMetadataValue,
          value: webhookSecret,
        },
      });

      if (!(customMetadataResponse as SaveResult).success) {
        this.ctx.throw(400, `Failed to create CustomMetadata ${webhookSecretMetadataFieldReference}`);
      }
    }

    // 3. Ensure the base Http Apex class and Test are created
    const apexClass = await createApexClass({
      className: this.webhookClassName,
      webhookId,
      webhookSecretMetadata,
      webhookSecretMetadataValue,
    });

    await this.createOrUpdateApexClass(this.webhookClassName, apexClass);

    const apexTestClass = await createApexTestClass({
      testClassName: this.webhookTestClassName,
      webhookClassName: this.webhookClassName,
      webhookEndpoint: this.webhookEndpoint,
    });

    await this.createOrUpdateApexClass(this.webhookTestClassName, apexTestClass);

    //TODO: Return expected types not Record.
    return { webhookId, webhookSecret };
  }

  public async createSalesforceTrigger({ entityId, events }: INewWebhookOptions): Promise<jsforce.RecordResult> {
    const triggerName = `Trigger_${this.apexIdentifier}_${entityId}`;

    const apexTrigger = await createApexTrigger({
      triggerName,
      webhookClassName: this.webhookClassName,
      entityId,
      webhookEndpoint: this.webhookEndpoint,
      events,
    });

    const createdTrigger = await this.client.tooling.sobject('ApexTrigger').create({
      name: triggerName,
      tableEnumOrId: entityId,
      body: apexTrigger,
    });

    return createdTrigger;
  }
}

export default WebhookManager;
