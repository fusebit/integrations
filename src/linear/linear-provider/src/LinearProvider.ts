import { Internal } from '@fusebit-int/framework';
import { IInstanceConnectorConfig } from '@fusebit-int/framework/libc/ConnectorManager';
import { LinearClient as Client } from '@linear/sdk';

export default class LinearProvider extends Internal.ProviderActivator<FusebitLinearClient> {
  /*
   * This function will create an authorized wrapper of the Linear SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitLinearClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitLinearClient = new Client({ accessToken: credentials.access_token });
    client.fusebit = { credentials, webhook: new LinearWebhook(client, ctx, this.config) };
    return client;
  }
}

interface ILinearWebhookConfig {
  teamId?: string;
  allPublicTeams?: boolean;
  resourceTypes: string[];
}

class LinearWebhook {
  constructor(
    private linearSdk: FusebitLinearClient,
    private ctx: Internal.Types.Context,
    private config: IInstanceConnectorConfig
  ) {}

  public async createWebhook(webhookConfig: ILinearWebhookConfig) {
    const results = await this.linearSdk.webhookCreate({
      url: getWebhookUrl(this.ctx, this.config),
      ...webhookConfig,
    });
    return { success: results.success, webhook: results.webhook };
  }

  public async listWebhook() {
    const results = await this.linearSdk.webhooks();
    return results.nodes;
  }

  public async deleteWebhook(id: string): Promise<Boolean> {
    const result = await this.linearSdk.webhookDelete(id);
    return result.success;
  }
}

const getWebhookUrl = (ctx: Internal.Types.Context, config: IInstanceConnectorConfig): string => {
  const params = ctx.state.params;
  const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${config.entityId}}/api/fusebit_webhook_event`;
  return baseUrl;
};
