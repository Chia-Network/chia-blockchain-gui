import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';

let electronApp: ElectronApplication;
let page: Page;
let wallet_new, wallet_new_address;


test.beforeEach(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  //electronApp = await electron.launch({ headless: true });
  page = await electronApp.firstWindow();
  
});

test.afterEach(async () => {
  await electronApp.close();
});

//Works and Passes
test('Confirm user can navigate the Settings page', async () => {

  //Given I navigate to 1651231316 Wallet
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('div[role="button"]:has-text("Private key with public fingerprint 1651231316Can be backed up to mnemonic seed")').click()
  ]);


  // And I click on the Setting button
  await page.locator('div[role="button"]:has-text("Settings")').click();
  // assert.equal(page.url(), 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/settings');

  // Then I can confirm Wallet page loads
  await page.locator('button:has-text("Wallet")').click();

  // And I confirm that Farming tab works
  await page.locator('text=Farming').click();

  // And I confirm that Dark theme works 
  await page.locator('text=Dark').click();

  // And I confirm that Light theme works 
  await page.locator('text=Light').click();

  // Click button:has-text("English")
  await page.locator('button:has-text("English")').click();

  // And I can select a Language
  await page.locator('text=English').nth(1).click();

  // Click text=Send Feedback
  await page.locator('text=Send Feedback').click();

  // Click text=Frequently Asked Questions
  await page.locator('text=Frequently Asked Questions').click();

  // Click text=Set Passphrase
  await page.locator('text=Set Passphrase').click();

  // Click text=Cancel
  await page.locator('text=Cancel').click();

  //await electronApp.close();

});





