import { test } from '@playwright/test';

import { IAccount, getAccount, Utilities } from '@fusebit-int/play';

import { authenticate } from './actions';
let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test('Proxy: Atlassian Jira', async ({ page }) => {
  await Utilities.runProxyTest(account, page, 'Atlassian Jira', authenticate, 'issues in Jira Cloud');
}, 180000);
