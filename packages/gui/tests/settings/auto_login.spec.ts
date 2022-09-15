import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';

let electronApp: ElectronApplication;
let page: Page;


  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
    //electronApp = await electron.launch({ headless: true });
    page = await electronApp.firstWindow();
    
  });

  test.afterAll(async () => {
    await page.close();
  });

test('Confirm Enable Auto Login feature works as expected. ', async () => {
  
  // Given I click the Setting's Gear
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();

  //And I disable Auto Login feature 
  await page.locator('input[type="checkbox"]').uncheck();

  //When I log out and back in 
  await page.close();
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();

  //Then user should have to select a Wallet 
  await Promise.all([
      page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
      page.locator('div[role="button"]:has-text("Private key with public fingerprint 1922132445Can be backed up to mnemonic seed")').click()
    ]);
  
  // When I re-enable Auto Login 
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();
  await page.locator('input[type="checkbox"]').check();

  // Then Auto Login setting is saved
  await page.close();

  // And User is Auto logged in upon next visit
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();
  await page.waitForURL('file:///Users/jahifaw/Documents/Code/chia-tn-pw-latest/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/settings/general');
  await page.close();
});


