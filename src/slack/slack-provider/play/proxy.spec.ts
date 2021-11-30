import { test } from '@playwright/test';

import { IAccount, getAccount, Utilities } from '@fusebit-int/play';

import { authenticate } from './actions';
let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test('Proxy: Slack Bot', async ({ page }) => {
  await Utilities.runProxyTest(account, page, 'Slack Bot', authenticate, 'Successfully sent a message to Slack');
}, 180000);
