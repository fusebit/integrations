import { Page } from '@playwright/test';

const { OAUTH_USERNAME, OAUTH_PASSWORD } = process.env;

export async function authenticate(page: Page) {
  await page.fill('[placeholder="Email or phone"]', OAUTH_USERNAME);
  await page.click('text=Next');
  await page.fill('input[name="Passwd"]', OAUTH_PASSWORD);
  await Promise.all([page.waitForNavigation(), page.click('input:has-text("Sign in")')]);

  await page.click('button:has-text("Allow")');
}
