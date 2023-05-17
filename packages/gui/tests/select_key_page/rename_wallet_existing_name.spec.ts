import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { CloseDialog } from '../data_object_model/close_dialog';
import { waitForDebugger } from 'inspector';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Verify that renaming a wallet to an existing wallet name should throw an error.', async () => {
  const existingName = 'Jahi 1st Wallet';
  const orgName = 'NFT TESTING WALLET';

  //Pre-requisites to get user back to Wallet selection page
  await new CloseDialog(page).closeIt();

  //Given I click on miniMenu on a Wallet name
  await page.locator('[data-testid="SelectKeyItem-fingerprint-965505910"] [aria-label="more"]').click();

  //And I click on rename option
  await page.locator('text=Rename').click();

  //And I enter a new Name
  await page.locator('[data-testid="SelectKeyRenameForm-label"]').fill(existingName);
  await page.getByTestId('SelectKeyRenameForm-save').click();

  //Assert that error message is displayed
  await expect(page.locator('div[role="dialog"]')).toHaveText(
    "Errormalformed request: label 'Jahi 1st Wallet' already exists for fingerprint '1922132445'OK"
  );
  await page.getByRole('button', { name: 'OK' }).click();

  //When I cancel/esc rename option
  await page.locator('[aria-label="cancel"]').click();

  //Then previous name is still displaying
  await page.locator('[data-testid="SelectKeyItem-fingerprint-965505910"]').click();
  //await page.pause();
  await page.waitForLoadState();
  await expect(page.getByRole('heading', { name: 'NFT TESTING WALLET' })).toBeVisible();
  //await expect(page.getByRole('heading', { name: orgName })).toBeVisible();
});
