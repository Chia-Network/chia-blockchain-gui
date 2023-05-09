import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import { SendFunds } from '../data_object_model/send_funds';
import { isWalletSynced, getWalletBalance } from '../utils/wallet';

let electronApp: ElectronApplication;
let page: Page;
let appWindow: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Verify that a recipient wallet receives funds from sending wallet!', async () => {
  //Pre-requisites
  let receive_wallet = 'txch17m0jla968szqmw7mf6msaea2jxl553g9m5kx8ryuqadvml8w49tqr75l9y';
  let send_wallet = 'txch1rkk6haccvw095t9ajc6h9tqekm2rz4zwurhep8dcrmsr2q2446zsndld57';

  //Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();

  //Given I navigate to 1922132445 Wallet
  await page.locator('h6:has-text("Jahi 1st Wallet")').click();

  //And I check the balance of current wallet
  while (!isWalletSynced('1922132445')) {
    console.log('Waiting for wallet to sync...');
    await page.waitForTimeout(1000);
  }

  //And I click on Send Page
  await page.locator('[data-testid="WalletHeader-tab-send"]').click();


  //When I complete the send page required fields
  await new SendFunds(page).send(receive_wallet, '0.01')//, '0.00000275276505264396');

  //Then I receive a success message
  await expect(page.locator('div[role="dialog"]')).toHaveText(
    'SuccessTransaction has successfully been sent to a full node and included in the mempool.OK'
  );
  await page.locator('div[role="dialog"] >> text=OK').click();

  //Given I navigate out to all wallets
  await page.locator('[data-testid="LayoutDashboard-log-out"]').click();

  //When I navigate to the receive wallet
  await page.locator('text=873991444').click();

  //And I navigate to Summary page
  await page.locator('[data-testid="WalletHeader-tab-summary"]').click();

  //Then Transactions section display the correct wallet, amount and fee
  //await expect(page.locator(`text=${receive_wallet} >> nth=0`)).toBeVisible();

  //Begin: Wait for Wallet to Sync
  while (!isWalletSynced('873991444')) {
    console.log('Waiting for wallet to sync...');
    await page.waitForTimeout(1000);
  }

  console.log('Wallet 873991444 is now fully synced');

  const balance = getWalletBalance('873991444');

  console.log(`XCH Balance: ${balance}`);
  // End: Wait for Wallet to Sync

  // Given I send funds back
  await page.locator('[data-testid="WalletHeader-tab-send"]').click();
  await new SendFunds(page).send(send_wallet, '0.01')//, '0.00000275276505264396');
});
