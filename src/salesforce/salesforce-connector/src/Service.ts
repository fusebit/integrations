import { Connector } from '@fusebit-int/framework';
import { OAuthConnector, IOAuthToken } from '@fusebit-int/oauth-connector';

interface ISalesforceOAuthToken extends IOAuthToken {
  instance_url: string;
  id: string;
}

class Service extends OAuthConnector.Service {
  // Convert an OAuth token into the key used to look up matching installs for a webhook.
  public async getWebhookTokenId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const sfToken = token as ISalesforceOAuthToken;
    return [encodeURIComponent(sfToken.instance_url), encodeURIComponent(sfToken.id)];
  }
}

export { Service };
