import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';

import { LoginPage } from '../data_object_model/passphrase_login';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

// Works and Passes
test('Confirm can Create and Delete a Plot. ', async () => {
  // Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();

  // Given I navigate to a Wallet
  await new LoginPage(page).getPlayWrightWallet();

  // And I click on the Plots Icon
  await page.getByTestId('DashboardSideBar-plots').click();

  // And I click on ADD A PLOT
  await page.getByRole('button', { name: '+ Add a Plot' }).click();

  // When I add a Plot to a Plot NFT
  await page.getByRole('button', { name: 'Chia Proof of Space 1.0.11' }).click();
  await page.getByRole('option', { name: 'Chia Proof of Space 1.0.11' }).click();
  await page.getByRole('button', { name: '101.4GiB (k=32, temporary space: 239GiB)' }).click();
  await page.getByRole('option', { name: '208.8GiB (k=33, temporary space: 521GiB)' }).click();

  // Then I can Discard Plot Creation
  await page.locator('[data-testid="ArrowBackIosNewIcon"]').click();
  await page.getByRole('button', { name: 'Discard' }).click();
});
