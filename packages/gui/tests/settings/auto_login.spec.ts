import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import ChildProcess from 'child_process';
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

test('Confirm Enable Auto Login feature works as expected. ', async () => {
  //Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();
  //await page.locator('[data-testid="LayoutDashboard-log-out"]').click();

  //Given I navigate to 1922132445 Wallet
  await page.locator('h6:has-text("Jahi 1st Wallet")').click();

  //And I navigate to the Setting's Gear
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();

  //When I enable Auto Login feature
  await page.locator('input[type="checkbox"]').check();

  //Then Auto Login setting is saved
  await page.close();
  stopAllChia();

  //And User is Auto logged in upon next visit
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  await page.locator('button:has-text("Close")').click();
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();


  //When I disable Auto Login
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();
  await page.locator('input[type="checkbox"]').uncheck();

  //Then I can confirm Wallet page loads
  //await page.locator('[data-testid="LayoutDashboard-log-out"]').click();
  await page.close();
  stopAllChia();

  //And User is not Auto logged in upon next visit
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  await page.locator('button:has-text("Close")').click();
});
