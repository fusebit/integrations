import * as fs from 'fs';
import { expect } from '@playwright/test';
import { IAccount, waitForOperation, fusebitRequest, RequestMethod, postAndWait } from './sdk';
export interface IIntegrationVariable {
  name: string;
  value: string;
}
export interface IConfiguration {
  integrationId: string;
  connectorId: string;
  packageProvider: string;
  packageConnector: string;
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  signingSecret?: string;
  audience?: string;
  oauthScopes?: string;
  extraParams?: string;

  adjustIntegrationConfiguration?: (integrationConfiguration: any) => Promise<any>;
  adjustConnectorConfiguration?: (connectorConfiguration: any) => Promise<any>;
}

export const {
  OAUTH_USERNAME,
  OAUTH_PASSWORD,
  SECRET_CLIENTID,
  SECRET_CLIENTSECRET,
  INTEGRATION_ID,
  CONNECTOR_ID,
  PACKAGE_PROVIDER,
  PACKAGE_CONNECTOR,
  AUTHORIZATION_URL,
  TOKEN_URL,
  SIGNING_SECRET,
  OAUTH_SCOPES,
  OAUTH_AUDIENCE,
  EXTRA_PARAMS,
} = process.env;

const makeIntegration = (configuration: IConfiguration, integrationVariables: IIntegrationVariable[] = []) =>
  configuration.adjustIntegrationConfiguration!({
    id: configuration.integrationId,
    data: {
      componentTags: {},
      configuration: {},

      handler: './integration',
      components: [
        {
          name: configuration.connectorId,
          entityType: 'connector',
          entityId: configuration.connectorId,
          dependsOn: [],
          provider: configuration.packageProvider,
        },
      ],
      files: {
        'integration.js': readIntegrationFile(integrationVariables),
        'package.json': JSON.stringify({ dependencies: { superagent: '*' } }),
      },
    },
  });

const readIntegrationFile = (integrationVariables: IIntegrationVariable[] = []): string => {
  let fileContents = fs.readFileSync('./play/mock/integration.js', 'utf8');
  if (integrationVariables.length) {
    integrationVariables.forEach((variable: IIntegrationVariable) => {
      fileContents = fileContents.replace(variable.name, variable.value);
    });
  }
  return fileContents;
};

const makeConnector = (configuration: IConfiguration) =>
  configuration.adjustConnectorConfiguration!({
    id: configuration.connectorId,
    data: {
      handler: configuration.packageConnector,
      configuration: {
        scope: configuration.oauthScopes,
        authorizationUrl: configuration.authorizationUrl,
        tokenUrl: configuration.tokenUrl,
        clientId: configuration.clientId,
        clientSecret: configuration.clientSecret,
        signingSecret: configuration.signingSecret,
        audience: configuration.audience,
        extraParams: configuration.extraParams,
        accessTokenExpirationBuffer: 500,
      },
    },
  });

export const ensureEntities = async (
  account: IAccount,
  configuration: IConfiguration,
  integrationVariables: IIntegrationVariable[] = []
) => {
  configuration.adjustConnectorConfiguration = configuration.adjustConnectorConfiguration || ((x: any) => x);
  configuration.adjustIntegrationConfiguration = configuration.adjustIntegrationConfiguration || ((x: any) => x);

  const recreateIntegration = async () => {
    let result = await fusebitRequest(account, RequestMethod.delete, `/integration/${configuration.integrationId}`);
    result = await waitForOperation(account, `/integration/${configuration.integrationId}`);
    expect(result).toBeHttp({ statusCode: 404 });
    result = await postAndWait(
      account,
      `/integration/${configuration.integrationId}`,
      makeIntegration(configuration, integrationVariables)
    );
    expect(result).toBeHttp({ statusCode: 200 });
  };

  const recreateConnector = async () => {
    await fusebitRequest(account, RequestMethod.delete, `/connector/${configuration.connectorId}`);
    let result = await waitForOperation(account, `/connector/${configuration.connectorId}`);
    expect(result).toBeHttp({ statusCode: 404 });
    result = await postAndWait(account, `/connector/${configuration.connectorId}`, makeConnector(configuration));
    expect(result).toBeHttp({ statusCode: 200 });
  };

  await Promise.all([recreateIntegration(), recreateConnector()]);
};
