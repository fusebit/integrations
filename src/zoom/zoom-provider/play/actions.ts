import { Page } from '@playwright/test';

const { OAUTH_USERNAME, OAUTH_PASSWORD } = process.env;

export async function authenticate(page: Page) {
  // TODO: The following code is just a sample. Use
  // 'npx playwright codegen https://auth.service-being-tested.com' to generate the steps for
  // the service you are writing the tests.

  // Perform the login
  await page.click('input[name="email"]');
  await page.fill('input[name="email"]', OAUTH_USERNAME);
  await page.fill('input[name="password"]', OAUTH_PASSWORD);
  await page.click('button[id="signin_btn"]');

  // Accept the permissions page
  await page.click('button:has-text("Allow")');
}