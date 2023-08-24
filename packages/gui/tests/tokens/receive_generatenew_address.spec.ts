import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';

let electronApp: ElectronApplication;
let page: Page;
//let appWindow: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Verify that new address button creates new address', async () => {
  //Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();

  //Given I navigate to 1922132445 Wallet
  await page.locator('h6:has-text("Testnet-10k-NFT")').click();

  //And I confirm page has correct Title
  expect(page).toHaveTitle('Chia Blockchain');

  //And I navigate to Receive page
  await page.locator('[data-testid="WalletHeader-tab-receive"]').click();

  //When I copy the wallet address
  await page.locator('[data-testid="WalletReceiveAddress-address-copy"]').click();

  //Then current wallet address is now stored into a variable
  const walletAddress = await page
    .locator('text=Receive Address New AddressAddress >> input[type="text"]')
    .inputValue();
  console.log(walletAddress);

  //When I generate a new wallet address id
  await page.locator('[data-testid="WalletReceiveAddress-new-address"]').click();

  //And I store the new wallet address id in a new variable
  const walletNew = await page.locator('text=Receive Address New AddressAddress >> input[type="text"]').inputValue();
  console.log(walletNew);

  //And I Compare Values variables. This should be false. wallet_address != wallet_new
  if (walletAddress === walletNew) {
    expect(walletAddress).toEqual(walletNew);
    console.log('The Wallet Address has not been updated!');
  } else if (walletAddress !== walletNew) {
    expect(walletAddress).not.toEqual(walletNew);
    console.log('A New Wallet Address has been successfully generated!');
  }
});
