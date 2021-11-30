import { Page } from '@playwright/test';

const { OAUTH_USERNAME, OAUTH_PASSWORD, SLACK_WORKSPACE } = process.env;

export async function authenticate(page: Page) {
  // Select the workspace
  await page.fill('input[name="domain"]', SLACK_WORKSPACE);
  await page.click('button:has-text("Continue")');

  // Perform the login
  await page.click('input[name="email"]');
  await page.fill('input[name="email"]', OAUTH_USERNAME);
  await page.fill('input[name="password"]', OAUTH_PASSWORD);
  await page.click('button[id="signin_btn"]');

  // Accept the permissions page
  await page.click('button:has-text("Allow")');
}
