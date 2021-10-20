import superagent from 'superagent';
import * as child_process from 'child_process';

import { expect } from '@playwright/test';

const MAX_WAIT_MS = 120000;

export interface IAccount {
  accountId: string;
  subscriptionId: string;
  baseUrl: string;
  accessToken: string;
  userAgent: string;
}

export enum RequestMethod {
  get = 'get',
  post = 'post',
  put = 'put',
  patch = 'patch',
  delete = 'delete',
}

export const getAccount = (): IAccount => {
  const profile = JSON.parse(
    child_process.spawnSync('fuse', ['profile', 'get', '-o json'], { encoding: 'utf8', shell: true, windowsHide: true })
      .stdout
  );
  const token = child_process.spawnSync('fuse', ['token', '-o raw'], {
    encoding: 'utf8',
    shell: true,
    windowsHide: true,
  }).stdout;

  return {
    accountId: profile.account,
    subscriptionId: profile.subscription,
    baseUrl: profile.baseUrl,
    accessToken: token.trim(),
    userAgent: 'fusebit/playwright',
  };
};

export const fusebitRequest = async (
  account: IAccount,
  method: RequestMethod,
  url: string,
  payload: any = {}
): superagent.Request => {
  const fullUrl = url.startsWith('http')
    ? url
    : `${account.baseUrl}/v2/account/${account.accountId}/subscription/${account.subscriptionId}${url}`;
  return superagent[method](fullUrl)
    .set('authorization', `Bearer ${account.accessToken}`)
    .set('user-agent', account.userAgent)
    .set('content-type', 'application/json')
    .ok(() => true)
    .send(payload);
};

const waitForOperation = async (account: IAccount, url: string) => {
  const startTime = Date.now();
  let response: superagent.Request;
  do {
    response = await fusebitRequest(account, RequestMethod.get, url);
    if (!response.body?.operationState || response.body.operationState.status !== 'processing') {
      break;
    }
  } while (startTime + MAX_WAIT_MS > Date.now());
  return response;
};

export const putAndWait = async (account: IAccount, entityPath: string, payload: any) => {
  let response = await fusebitRequest(account, RequestMethod.put, entityPath, payload);
  expect(response).toBeHttp({ statusCode: 200 });

  return waitForOperation(account, entityPath);
};

export const createSession = async (account: IAccount, integrationId: string, redirectUrl: string) => {
  const response = await fusebitRequest(account, RequestMethod.post, `/integration/${integrationId}/session/`, {
    redirectUrl,
  });
  expect(response).toBeHttp({ statusCode: 200 });
  return response.body.targetUrl;
};

export const commitSession = async (account: IAccount, integrationId: string, sessionId: string) => {
  const response = await fusebitRequest(
    account,
    RequestMethod.post,
    `/integration/${integrationId}/session/${sessionId}/commit`
  );
  expect(response).toBeHttp({ statusCode: 202 });

  return waitForOperation(account, response.body.targetUrl);
  return response.body;
};

export const updateIntegrationConnector = async (account: IAccount, integrationEntity: any, connectorEntity: any) => {
  const putIntegration = async () => {
    const response = await putAndWait(account, `/integration/${integrationEntity.id}`, integrationEntity);
    expect(response).toBeHttp({ statusCode: 200, data: { operationState: { status: 'success' } } });
  };

  const putConnector = async () => {
    const response = await putAndWait(account, `/connector/${connectorEntity.id}`, connectorEntity);
    expect(response).toBeHttp({ statusCode: 200, data: { operationState: { status: 'success' } } });
  };

  const results = await Promise.all([putIntegration(), putConnector()]);
};

export const logPage = async (page: Page) => {
  await page.route(`**`, (route, request) => {
    console.log(request.url());
    route.continue();
    // _resolve();
  });
};
