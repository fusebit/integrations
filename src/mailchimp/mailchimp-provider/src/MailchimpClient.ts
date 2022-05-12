import { Internal } from '@fusebit-int/framework';
import superagent from 'superagent';

import mailChimpMarketingClient from '@mailchimp/mailchimp_marketing';

class MailchimpClient {
  private ctx: Internal.Types.Context;
  public fusebit: Internal.Types.IFusebitCredentials;
  private metadataPath: string = '/api/oauth/metadata';
  public marketing: any;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.marketing = mailChimpMarketingClient;
  }

  public async configureMarketingApi(): Promise<void> {
    // Fetch metadata and get the server prefix
    const serverPrefix = await this.getMetadata();

    this.marketing.setConfig({
      accessToken: this.fusebit.credentials.access_token,
      server: serverPrefix,
    });
  }

  private async getMetadata(): Promise<string> {
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.fusebit.connectorId}`;
    const response = await superagent
      .get(`${baseUrl}${this.metadataPath}`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`);
    return response.body;
  }
}

export default MailchimpClient;
