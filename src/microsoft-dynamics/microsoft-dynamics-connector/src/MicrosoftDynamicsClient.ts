import { Internal } from '@fusebit-int/framework';
import { IOAuthToken } from '@fusebit-int/oauth-connector';
import {
  ICreateWebhookData,
  ICreateWebhookStepData,
  ISdkMessageIdResponse,
  ISdkMessageFilterResponse,
  ISdkMessageResponse,
  IWebhookStep,
  IWebhookStepResponse,
  IMicrosoftDynamicsWebhook,
} from './Types';

class MicrosofDynamicsClient extends Internal.Provider.ApiClient {
  private apiPath = 'api.crm.dynamics.com/api/data/v9.2';
  private ctx: Internal.Types.Context;
  private webhookUrl: string;

  constructor(ctx: Internal.Types.Context, organizationName: string, accessToken: string) {
    super(
      (url: string) => `https://${organizationName}.${this.apiPath}/${url}`,
      ctx.state.params.entityId,
      accessToken
    );
    this.ctx = ctx;
    this.connectorId = ctx.state.params.entityId;
    const baseUrl = `${this.ctx.state.params.endpoint}/v2/account/${this.ctx.state.params.accountId}/subscription/${this.ctx.state.params.subscriptionId}`;
    this.webhookUrl = `${baseUrl}/connector/${ctx.state.params.entityId}/api/fusebit/webhook/event`;
  }

  public async createWebhook(webhookData: ICreateWebhookData) {
    return this.post('serviceendpoints', {
      ...webhookData,
      url: this.webhookUrl,
    });
  }

  public async createWebhookStep({
    name,
    stage,
    rank,
    serviceEndpointId,
    messageId,
    messageFilterId,
    supportedDeployment,
  }: ICreateWebhookStepData) {
    const requestData = { name, stage, rank, supporteddeployment: supportedDeployment };
    (requestData as any)['eventhandler_serviceendpoint@odata.bind'] = `/serviceendpoints(${serviceEndpointId})`;
    (requestData as any)['sdkmessageid@odata.bind'] = `/sdkmessages(${messageId})`;
    (requestData as any)['sdkmessagefilterid@odata.bind'] = `/sdkmessagefilters(${messageFilterId})`;
    return this.post('sdkmessageprocessingsteps', requestData);
  }

  public async getWebhookByName(name: string): Promise<IMicrosoftDynamicsWebhook | undefined> {
    const { value } = await this.get(`serviceendpoints?$filter=name eq '${name}'`);
    if (value.length) {
      return value[0];
    }
  }

  public async getSdkMessageId(
    sdkMessageFilter: string,
    sdkMessage: string
  ): Promise<ISdkMessageIdResponse | undefined> {
    const { value } = await this.get<ISdkMessageFilterResponse>(
      `sdkmessagefilters?$filter=primaryobjecttypecode eq '${sdkMessageFilter.toLowerCase()}'`
    );

    if (!value.length) {
      return;
    }

    for await (const { _sdkmessageid_value, sdkmessagefilterid } of value) {
      const { value: sdkMessageValue } = await this.get<ISdkMessageResponse>(
        `sdkmessages?$filter=sdkmessageid eq '${_sdkmessageid_value}' and categoryname eq '${sdkMessage.toLowerCase()}' and isprivate eq false&$top=1`
      );

      if (!sdkMessageValue.length) {
        continue;
      }
      return { sdkMessageId: sdkMessageValue[0].sdkmessageid, sdkMessageFilterId: sdkmessagefilterid };
    }
  }

  public async getWebhookStep(
    webhookId: string,
    sdkMessageId: string,
    stepName: string,
    stage: number
  ): Promise<IWebhookStep | undefined> {
    const { value } = await this.get<IWebhookStepResponse>(
      `sdkmessageprocessingsteps?$top=10&$filter=supporteddeployment eq 0 and stage eq ${stage} and _sdkmessageid_value eq '${sdkMessageId}' and name eq '${stepName}' and _eventhandler_value eq '${webhookId}'`
    );

    if (!value.length) {
      return;
    }

    return value[0];
  }

  public async getWebhookSteps(webhookId: string) {
    return this.get(`sdkmessageprocessingsteps?$filter=_eventhandler_value eq '${webhookId}'`);
  }

  public async getWebhookStepById(webhookStepId: string) {
    return this.get(`sdkmessageprocessingsteps?$filter=sdkmessageprocessingstepid eq '${webhookStepId}'`);
  }

  public async deleteWebhookStep(stepId: string) {
    return this.delete(`sdkmessageprocessingsteps(${stepId})`);
  }

  public async deleteWebhook(webhookId: string) {
    return this.delete(`serviceendpoints(${webhookId})`);
  }
}

export default MicrosofDynamicsClient;
