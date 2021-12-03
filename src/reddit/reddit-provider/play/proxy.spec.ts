import { test } from '@playwright/test';

import { IAccount, getAccount, Utilities } from '@fusebit-int/play';

import { authenticate } from './actions';
let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test('Proxy: Reddit', async ({ page }) => {
  await Utilities.runProxyTest(account, page, 'Reddit', authenticate, 'karma from comments');
}, 180000);
