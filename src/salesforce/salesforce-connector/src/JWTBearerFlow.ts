import { Connector } from '@fusebit-int/framework';

import jwt from 'jsonwebtoken';
import superagent from 'superagent';

export interface IAccessToken {
  access_token: string;
  scope: string;
  instance_url: string;
  id: string;
  token_type: string;
}

/**
 * Represents an OAuth 2.0 JWT Bearer flow for Server-To-Server Integrations.
 * Read more at https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm&type=5
 */
class JWTBearerFlow {
  private privateKey: string;
  private clientId: string;
  private authorizedUser: string;
  private authorizationServer: string;
  private tokenUrl: string;

  constructor(ctx: Connector.Types.Context) {
    const {
      webhookPublisherPrivateKey,
      webhookPublisherClientId,
      webhookPublisherUser,
      webhookPublisherAuthorizationServer,
    } = ctx.state.manager.config.configuration;

    this.privateKey = webhookPublisherPrivateKey;
    this.clientId = webhookPublisherClientId;
    this.authorizedUser = webhookPublisherUser;
    this.authorizationServer = webhookPublisherAuthorizationServer || 'https://login.salesforce.com';
    this.tokenUrl = `${this.authorizationServer}/services/oauth2/token`;
  }

  private async generateJwt() {
    const formattedKey = this.privateKey
      .replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN RSA PRIVATE KEY-----\n')
      .replace('-----END RSA PRIVATE KEY-----', '\n-----END RSA PRIVATE KEY-----');

    const payload = {
      iat: Math.floor(Date.now() / 1000) - 60, // issued at time, 60 seconds in the past to allow for clock drift
      exp: Math.floor(Date.now() / 1000) + 60 * 10, // JWT expiration time (10 minutes maximum)
      iss: this.clientId,
      aud: this.authorizationServer,
      sub: this.authorizedUser,
    };

    const response = jwt.sign(payload, formattedKey, { algorithm: 'RS256' });

    return {
      jwt: response,
      expiresAt: payload.exp * 1000, // set expiration in ms
    };
  }

  public async getAccessToken(): Promise<IAccessToken> {
    const { jwt } = await this.generateJwt();
    const tokenResponse = await superagent.post(this.tokenUrl).type('application/x-www-form-urlencoded').send({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    });

    return tokenResponse.body;
  }
}

export default JWTBearerFlow;
