import { Constants } from '@fusebit-int/play';
import { Page } from '@playwright/test';

export async function authenticate(page: Page) {
  // Perform the login
  await page.click('input[name="username"]');
  await page.fill('input[name="username"]', Constants.OAUTH_USERNAME);
  await page.fill('input[name="password"]', Constants.OAUTH_PASSWORD);
  await page.click('button:has-text(" Log In ")');

  // Accept the permissions page
  await Promise.race([page.waitForEvent('close'), page.click('input[name="authorize"]')]);
}
