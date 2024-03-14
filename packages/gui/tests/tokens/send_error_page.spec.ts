import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { isWalletSynced, getWalletBalance } from '../utils/wallet';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Confirm Error Dialog when wrong data is entered on Send Page for 1922132445 ID', async () => {
  let fundedWallet = '1922132445';

  //Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();

  //Given I navigate to a wallet with funds
  await page.locator(`text=${fundedWallet}`).click();

  // Begin: Wait for Wallet to Sync
  while (!isWalletSynced(fundedWallet)) {
    console.log('Waiting for wallet to sync...');
    await page.waitForTimeout(1000);
  }

  console.log(`Wallet ${fundedWallet} is now fully synced`);

  const balance = getWalletBalance(fundedWallet);

  console.log(`XCH Balance: ${balance}`);
  //End: Wait for Wallet to Sync

  //And I click on Send Page
  await page.locator('[data-testid="WalletHeader-tab-send"]').click();

  //When I enter an invalid address in address field
  await page.locator('[data-testid="WalletSend-address"]').fill('$$%R*(%^&%&&^%');

  //And I enter a valid Amount
  await page.locator('[data-testid="WalletSend-amount"]').fill('.0005');

  //And I enter a valid Fee
  //await page.locator('[data-testid="WalletSend-fee"]').fill('.00000005');

  //And I click Send button
  await page.locator('[data-testid="WalletSend-send"]').click();

  //Then I receive an informative error message
  await expect(page.locator('div[role="dialog"]')).toHaveText(
    'ErrorUnexpected Address PrefixOK' || 'ErrorPlease finish syncing before making a transactionOK',
  );
  await page.locator('div[role="dialog"] >> text=OK').click();
});
