import { Internal } from '@fusebit-int/framework';
import superagent from 'superagent';
import { Octokit as Client } from 'octokit';

export interface GitHubAppJwt {
  jwt: string;
  expiresAt: number;
}

class GitHubClient {
  private ctx: Internal.Types.Context;
  private fusebit: Internal.Types.IFusebitCredentials;
  private readonly appBaseUrl = 'https://api.github.com/app';
  private readonly tokenPath = '/api/token/app';
  private appJwt!: GitHubAppJwt;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
  }

  /**
   * Authenticate as the authorizing user
   * Your GitHub App can perform actions on behalf of a user, like creating an issue
   * creating a deployment, and using other supported endpoints.
   */
  public user() {
    return new Client({ auth: this.fusebit.credentials.access_token });
  }

  /**
   * Authenticate as a GitHub App.
   * You can use this to retrieve high-level management information about your GitHub App
   */
  public async app() {
    await this.checkJwtCache();
    return new Client({ auth: this.appJwt.jwt });
  }

  /**
   * Authenticate as a GitHub App installation.
   * Ensure that you have already installed your GitHub App to at least one repository
   */
  public async installation(gitHubInstallationId: number) {
    const gitHubInstallationToken = await this.getInstallationToken(gitHubInstallationId);
    return new Client({ auth: gitHubInstallationToken });
  }

  private isJwtTokenExpired(): boolean {
    if (!this.appJwt) {
      return true;
    }
    return Date.now() >= this.appJwt.expiresAt;
  }

  private async getInstallationToken(gitHubInstallationId: number): Promise<any> {
    await this.checkJwtCache();
    const response = await superagent
      .post(`${this.appBaseUrl}/installations/${gitHubInstallationId}/access_tokens`)
      .set('User-Agent', `fusebit/${this.ctx.state.params.entityId}`)
      .set('Accept', 'application/vnd.github.v3+json')
      .set('Authorization', `Bearer ${this.appJwt.jwt}`);
    return response.body.token;
  }

  private async checkJwtCache(): Promise<void> {
    if (this.isJwtTokenExpired()) {
      this.appJwt = await this.getJwtToken();
    }
  }

  private async getJwtToken(): Promise<GitHubAppJwt> {
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.fusebit.connectorId}`;
    const response = await superagent
      .get(`${baseUrl}${this.tokenPath}`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`);
    return response.body;
  }
}

export { GitHubClient };
