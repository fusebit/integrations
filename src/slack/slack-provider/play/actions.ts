import { Constants } from '@fusebit-int/play';
import { Page } from '@playwright/test';

export interface IAuthenticateOptions {
  targetUrl: string;
  page: Page;
}

export async function authenticate({ page, targetUrl }: IAuthenticateOptions) {
  // Open the browser to the session url
  await page.goto(targetUrl);

  // Perform the login
  await page.click('input[name="email"]');
  await page.fill('input[name="email"]', Constants.OAUTH_USERNAME);
  await page.fill('input[name="password"]', Constants.OAUTH_PASSWORD);
  await page.click('button:has-text("Sign in")');

  // Accept the permissions page
  await page.click('button:has-text("Allow")');
}
