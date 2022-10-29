import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import ChildProcess from 'child_process';
import { stopAllChia } from '../utils/wallet';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  stopAllChia();
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Confirm Enable Auto Login feature works as expected. ', async () => {
  //Given I enter correct credentials in Passphrase dialog
  await new LoginPage(page).login('password2022!@');

  //And I click the Setting's Gear
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();

  //And I disable Auto Login feature
  await page.locator('input[type="checkbox"]').uncheck();

  //When I log out and back in
  await page.close();
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();

  //Then user should have to select a Wallet
  await page
    .locator('[data-testid="SelectKeyItem-fingerprint-1922132445"]')
    .click();

  //When I re-enable Auto Login
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();
  await page.locator('input[type="checkbox"]').check();

  //Then Auto Login setting is saved
  await page.close();
  stopAllChia();

  //And User is Auto logged in upon next visit
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  await new LoginPage(page).login('password2022!@');
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();
  await page.close();
  stopAllChia();
});
