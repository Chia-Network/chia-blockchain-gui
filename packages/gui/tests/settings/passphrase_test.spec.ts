import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import { waitForDebugger } from 'inspector';
import { stopAllChia } from '../utils/wallet';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

//Works and Passes
test('Confirm user can add and remove passphrase ', async () => {
  //await page.pause()
  //Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();

  //Given I navigate to 1922132445 Wallet
  await page.locator('h6:has-text("Jahi 1st Wallet")').click();

  //And I navigate to Setting's Page
  await page.locator('div[role="button"]:has-text("Settings")').click();

  //When I enable passphrase
  await page.locator('[data-testid="SettingsPanel-set-passphrase"]').click();
  await page.locator('[placeholder="Passphrase"]').fill('password2023!@');
  await page.locator('[data-testid="SetPassphrasePrompt-confirm-passphrase"]').fill('password2023!@');
  await page.getByTestId('SetPassphrasePrompt-hint').click();
  await page.getByTestId('SetPassphrasePrompt-hint').fill('Universal Password');
  await page.getByTestId('SetPassphrasePrompt-set-passphrase').click();
  await page.getByRole('button', { name: 'OK' }).click();

  //When I close and reopen Chia
  await page.locator('[data-testid="LayoutDashboard-log-out"]').click();
  await page.close();
  stopAllChia();

  await page.pause();
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  await page.locator('button:has-text("Close")').click();

  //Then I must use passphrase to log in
  //Given I enter the incorrect credentials in Passphrase dialog
  await new LoginPage(page).incorrectlogin();
  await page.locator('text=OK').click();

  //When I enter correct credentials in Passphrase dialog
  await new LoginPage(page).login('password2023!@');

  //Given I navigate back to settings page
  await page.locator('h6:has-text("Jahi 1st Wallet")').click();
  await page.locator('div[role="button"]:has-text("Settings")').click();

  //And I remove passphrase and close chia
  await page.locator('[data-testid="SettingsPanel-remove-passphrase"]').click();
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').fill('password2023!@');
  await page.locator('div[role="dialog"] button:has-text("Remove Passphrase")').click();
  await page.locator('button:has-text("OK")').click();

  //When I close and reopen Chia
  await page.locator('[data-testid="LayoutDashboard-log-out"]').click();
  await page.close();
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  await page.locator('button:has-text("Close")').click();

  //Then I will not use passphrase to log in
});
