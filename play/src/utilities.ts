import { expect, Page } from '@playwright/test';

import { IAccount } from './';

export const runProxyTest = async (
  account: IAccount,
  page: Page,
  integrationName: string,
  doOAuthLogin: (page: Page) => Promise<void>,
  successResponse: string
) => {
  await page.goto(
    `https://manage.fusebit.io/callback?silentAuth=false&requestedPath=/#access_token=${account.accessToken}&scope=openid%20profile%20email&expires_in=86400&token_type=Bearer`
  );

  await page.waitForNavigation({ url: /.*\/integrations\/overview$/ });

  // Click button:has-text("New integration")
  page.click('button:has-text("New integration")');

  // Click text=Atlassian Confluence
  await page.click(`text=${integrationName}`);

  // Click button:has-text("Create")
  page.click('button:has-text("Create")');

  // Click button:has-text("Edit")
  await page.click('button:has-text("Edit")', {
    timeout: 180000,
  });

  // Click button:has-text("Run")
  await page.click('button:has-text("Run")');

  // Click button:has-text("Start")
  const [oauthPage] = await Promise.all([page.waitForEvent('popup'), page.click('button:has-text("Start")')]);

  await doOAuthLogin(oauthPage);

  const logPanel = page.locator('.fusebit-logs-content');
  await expect(logPanel).toHaveText(/.*Received response/, { timeout: 60000 });
  await expect(logPanel).toHaveText(/.*Received response status 200/, { timeout: 10000 });
  await expect(logPanel).toHaveText(new RegExp(`.*${successResponse}`), { timeout: 10000 });
};
