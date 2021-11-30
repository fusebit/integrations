import { test } from '@playwright/test';

import { IAccount, getAccount, Utilities } from '@fusebit-int/play';

import { doOAuthLogin } from './actions';
let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test('Proxy: Reddit', async ({ page }) => {
  await Utilities.runProxyTest(account, page, 'Reddit', doOAuthLogin, 'spaces in Confluence Cloud');
}, 180000);

