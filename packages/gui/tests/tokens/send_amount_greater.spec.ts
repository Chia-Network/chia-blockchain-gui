import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { dialog } from 'electron';
import { LoginPage } from '../data_object_model/passphrase_login';
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

test('Confirm that User cannot send a TXCH amount greater then in Wallet', async () => {
  let receive_wallet = 'txch1ksr59en3j3t9zaprmya0jp9k6mkazq2u5lfccaf85sej7kgmvjjscanfxd';
  let funded_wallet = '1922132445';

  //Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();

  //And I navigate to a wallet with funds
  await page.locator(`text=${funded_wallet}`).click();

  //Begin: Wait for Wallet to Sync
  while (!isWalletSynced(funded_wallet)) {
    console.log('Waiting for wallet to sync...');
    await page.waitForTimeout(1000);
  }

  console.log(`Wallet ${funded_wallet} is now fully synced`);

  const balance = getWalletBalance(funded_wallet);

  console.log(`XCH Balance: ${balance}`);
  //End: Wait for Wallet to Sync

  //And I click on Send Page
  await page.locator('[data-testid="WalletHeader-tab-send"]').click();

  //When I enter a valid wallet address in address field
  await page.locator('[data-testid="WalletSend-address"]').fill(receive_wallet);

  //And I enter an amount higher then in account
  await page.locator('[data-testid="WalletSend-amount"]').fill('200');

  //Have to revisit the FEE component. And I enter a valid Fee
  //await page.locator('text=Fee *TXCH >> input[type="text"]').fill('0.000005');

  //And I click Send button
  await page.locator('[data-testid="WalletSend-send"]').click();

  //Then I receive an error message
  let haveBalanceString, stringBalance;
  stringBalance = balance?.toString();
  haveBalanceString = stringBalance.replace(/\./g, '');
  console.log(haveBalanceString);
  await expect(page.locator('div[role="dialog"]')).toHaveText(
    //`ErrorCan\'t send more than ${haveBalanceString} in a single transactionOK`
    `ErrorCan't send more than ${haveBalanceString} mojos in a single transaction, got 200000000000000OK`
  );
  await page.locator('div[role="dialog"] >> text=OK').click();

  //And I navigate to Summary page
  await page.locator('[data-testid="WalletHeader-tab-summary"]').click();

  //Then there are no changes in the Pending Balance section
  await expect(page.getByText('Pending Balance0 TXCH')).toBeVisible();
});
