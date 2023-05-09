import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import { SendFunds } from '../data_object_model/send_funds';
import { isWalletSynced, getWalletBalance } from '../utils/wallet';
import { CloseDialog } from '../data_object_model/close_dialog';
import date from 'date-and-time';
const now = new Date();

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
  let receive_wallet = 'txch1km02nle6485x6fv676m7nx67zfyk75ed0znq3dwumj8wvxm2pvms9m0dnf';
  let send_wallet = 'txch1ls7ur56shuh58zlvzkqkwgzch8zy6llfwr7ydm3n8rvky4rdf3dqlceyzx';

  //Pre-requisites to get user back to Wallet selection page
  await new CloseDialog(page).closeIt();

  //Given I navigate to 4222064798 Wallet
  await page.locator('h6:has-text("send_wallet")').click();

  //And I check the balance of current wallet
  while (!isWalletSynced('4222064798')) {
    console.log('Waiting for wallet to sync...');
    await page.waitForTimeout(1000);
  }

  //And I click on Send Page
  await page.locator('[data-testid="WalletHeader-tab-send"]').click();

  //When I enter a valid Fee amount 
  await page.getByRole('button', { name: '0 (>5 min) TXCH' }).click()
  await page.getByRole('option', { name: 'Enter a custom fee...' }).click();
  await page.getByLabel('Fee').fill('0.0005');

  //And I enter a valid wallet address in address field
  await page.locator('[data-testid="WalletSend-address"]').fill(receive_wallet);

  //And I enter an amount
  await page.locator('[data-testid="WalletSend-amount"]').fill('.09');

  //When I enter a relevant memo
  await page.getByText('Show Advanced Options').click();
  await page.getByTestId('WalletSend-memo').click();
  await page.getByTestId('WalletSend-memo').fill('Show me the money');
  //await page.getByTestId('WalletSend-memo').press('Enter');

  //await page.pause();
  //And I click on Send button
  await page.getByTestId('WalletSend-send').click();

  //Then I should receive a success message
  await expect(page.locator('div[role="dialog"]')).toHaveText(
    'SuccessTransaction has successfully been sent to a full node and included in the mempool.OK'
  );
  await page.locator('div[role="dialog"] >> text=OK').click();
  
  //Given I navigate out to all wallets
  await new CloseDialog(page).logOut();

  //When I log in to receive wallet I can confirm transaction and memo
  await page.locator('h6:has-text("receive_wallet")').click();

  //And I check the balance of current wallet
  while (!isWalletSynced('1644586741')) {
    console.log('Waiting for wallet to sync...');
    await page.waitForTimeout(1000);
  }

  //And I click on Send Page
  await page.locator('[data-testid="WalletHeader-tab-send"]').click();

  //And I enter a valid wallet address in address field and amount 
  await page.locator('[data-testid="WalletSend-address"]').fill(send_wallet);
  await page.locator('[data-testid="WalletSend-amount"]').fill('.05');
  await page.getByText('Show Advanced Options').click();
  await page.getByTestId('WalletSend-memo').click();
  await page.getByTestId('WalletSend-memo').fill('Show me the money');
  await page.getByTestId('WalletSend-send').click();

  //Then I should receive a success message
  await expect(page.locator('div[role="dialog"]')).toHaveText(
    'SuccessTransaction has successfully been sent to a full node and included in the mempool.OK'
  );
  await page.locator('div[role="dialog"] >> text=OK').click();

  //Given I navigate out to all wallets
  await page.waitForTimeout(30000)
  await page.locator('[data-testid="LayoutDashboard-log-out"]').click();

  //When I log in to send wallet I can confirm transaction and memo
  await page.locator('h6:has-text("send_wallet")').click();
  await page.getByRole('button', { name: 'expand row' }).nth(0).click();
  await expect(page.getByText('Show me the money')).toBeVisible();


  //await page.pause();
  //Assert that Memo is avaiable on transaction
  // ; //Saw instances where page was not ready
  // //await page.locator('[data-testid="LayoutDashboard-log-out"]').click();
  // //await page.locator('h6:has-text("send_wallet")').click();
  // //await page.getByRole('row', { name: 'April 19, 2023 5:29 PM + 0.09 TXCH 0 TXCH txch1km02...0dnf Confirmed expand row' }).getByRole('button', { name: 'expand row' }).click();
  // //await page.getByText('Memos', { exact: true }).click();
  // //await page.getByRole('row', { name: `${date.format(now, 'MMMM D, YYYY h:mm A')} + 0.09 TXCH 0 TXCH txch1km02...0dnf Confirmed expand row` }).getByRole('button', { name: 'expand row' }).click();
  // //await page.getByRole('row', { name: `${date.format(now, 'MMMM D, YYYY')} + 0.09 TXCH 0 TXCH txch1km02...0dnf Confirmed Memo expand row` }).getByRole('button', { name: 'expand row' }).first().click();
  // //await expect(page.getByRole('row', { name: `${date.format(now, 'MMMM D, YYYY')} + 0.09 TXCH 0 TXCH txch1km02...0dnf Confirmed expand row` }).nth(0)).toBeVisible();

  // //await page.getByRole('button', { name: 'expand row' }).nth(0).click();
  
  // //await page.getByRole('row', { name: 'April 19, 2023 6:38 PM + 0.09 TXCH 0 TXCH txch1km02...0dnf Confirmed Memo expand row' }).getByRole('button', { name: 'expand row' }).click();

  // console.log(date.format(now, 'MMMM D, YYYY h:mm A'));
  // //await page.getByText('Show me the money').click();

  

   

  

});
