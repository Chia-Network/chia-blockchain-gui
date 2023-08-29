import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { CloseDialog } from '../data_object_model/close_dialog';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Verify that renaming work and canceling the renaming wallet flow works.', async () => {
  const orgName = 'playwright';
  const newName = 'MyChiaMainWallet';
  const fingerprint = '314593068';

  //Pre-requisites to get user back to Wallet selection page
  await new CloseDialog(page).closeIt();

  //Given I click on miniMenu on a Wallet name
  await page.locator(`[data-testid="SelectKeyItem-fingerprint-${fingerprint}"] [aria-label="more"]`).click();

  //And I click on rename option
  await page.locator('text=Rename').click();

  //And I enter a new Name
  await page.locator('[data-testid="SelectKeyRenameForm-label"]').fill(newName);

  //When I cancel/esc rename option
  await page.locator('[aria-label="cancel"]').click();

  //Then previous name is still displaying
  await expect(page.locator(`h6:has-text("${orgName}")`)).toBeVisible();

  //Given I rename the Wallet and save
  await page.locator(`[data-testid="SelectKeyItem-fingerprint-${fingerprint}"] [aria-label="more"]`).click();
  await page.locator('text=Rename').click();
  await page.locator('[data-testid="SelectKeyRenameForm-label"]').fill(newName);
  await page.locator('[data-testid="SelectKeyRenameForm-save"]').click();

  //Then new name displays inside of App
  await page.waitForTimeout(10000);
  await page.locator(`[data-testid="SelectKeyItem-fingerprint-${fingerprint}"]`).click();
  await expect(page.locator(`text=${newName}`)).toBeVisible();
  //await page.locator('[data-testid="ExitToAppIcon"]').click();
  await page.locator('[data-testid="LayoutDashboard-log-out"]').click();

  //And new name displays on select page
  await expect(page.locator(`h6:has-text("${newName}")`)).toBeVisible();
  expect(await page.locator(`h6:has-text("${orgName}")`).count()).toEqual(0);

  //Reset Test Data
  await page.locator(`[data-testid="SelectKeyItem-fingerprint-${fingerprint}"] [aria-label="more"]`).click();
  await page.locator('text=Rename').click();
  await page.locator('[data-testid="SelectKeyRenameForm-label"]').fill(orgName);
  await page.locator('[data-testid="SelectKeyRenameForm-save"]').click();
  await expect(page.locator(`h6:has-text("${orgName}")`)).toBeVisible();
});
