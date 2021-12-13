import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import {
  IApiClient,
  IAtlassianAccessibleResources,
  IAtlassianAccessibleResource,
  IAtlassianMe,
  IFusebitCredentials,
} from './Types';
import { HttpMethodTypes } from '../../../discord/discord-provider/src/Types';

class AtlassianClient extends ApiClient {

  jira: JiraClient;
  confluence: ConfluenceClient;
  constructor(urlToken: string, bearerToken: string) {
    this.jira = new JiraClient({urlToken, bearerToken});
    this.confluence = new ConfluenceClient({urlToken, bearerToken});
  }

}

class JiraClient extends ApiClient {
  constructor(options: {bearerToken: string, urlToken: string}) {
    super();
    this.bearerToken = options.bearerToken;
    this.baseUrl = `https://api.atlassian.com/ex/${options.urlToken}/jira`;
  }
}

class ConfluenceClient extends ApiClient {
  constructor(options: {bearerToken: string, urlToken: string}) {
    super();
    this.baseUrl = `https://api.atlassian.com/ex/${options.urlToken}/confluence`;
  }
}

export { AtlassianClient };
