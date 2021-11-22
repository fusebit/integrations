import { test } from '@playwright/test';

import { IAccount, getAccount, Utilities } from '@fusebit-int/play';

import { doOAuthLogin } from './actions';
let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test('Proxy: Atlassian Confluence', async ({ page }) => {
  await Utilities.runProxyTest(account, page, 'Atlassian Confluence', doOAuthLogin, 'spaces in Confluence Cloud');
}, 180000);

test('Proxy: Atlassian Jira', async ({ page }) => {
  await Utilities.runProxyTest(account, page, 'Atlassian Jira', doOAuthLogin, 'issues in Jira Cloud');
}, 180000);
