import { test } from '@playwright/test';

import { IAccount, getAccount, Utilities } from '@fusebit-int/play';

import { authenticate } from './actions';
let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test('Proxy: Reddit', async ({ page }) => {
  await Utilities.runProxyTest(account, page, 'Stack Overflow', authenticate, 'reputation points');
}, 180000);
