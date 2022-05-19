import { Internal } from '@fusebit-int/framework';
import superagent from 'superagent';

import mailChimpMarketingClient from '@mailchimp/mailchimp_marketing';

class MailchimpClient {
  private ctx: Internal.Types.Context;
  public fusebit: Internal.Types.IFusebitCredentials;
  public marketing: typeof mailChimpMarketingClient;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.marketing = mailChimpMarketingClient;
  }

  public async configureMarketingApi(): Promise<void> {
    // Fetch metadata and get the server prefix dynamically for the user.
    const metadata = await this.getMetadata();

    this.marketing.setConfig({
      accessToken: this.fusebit.credentials.access_token,
      server: metadata.dc,
    });
  }

  private async getMetadata(): Promise<any> {
    const metadataResponse = await superagent
      .get('https://login.mailchimp.com/oauth2/metadata')
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);

    return metadataResponse.body;
  }
}

export default MailchimpClient;
