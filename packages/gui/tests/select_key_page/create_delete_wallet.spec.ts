import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import { isWalletSynced, getWalletBalance } from '../utils/wallet';
import { waitForDebugger } from 'inspector';
import { CloseDialog } from '../data_object_model/close_dialog';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Create a new Wallet , logout and Delete new Wallet', async () => {
  //Pre-requisites to get user back to Wallet selection page
  await new CloseDialog(page).closeIt();

  //Given I navigate to the Import Existing page
  await page.getByRole('button', { name: 'Add wallet' }).click();

  //And I click the Create New Private Key button
  await page.getByText('Create New').click();

  //When I enter a Wallet Name
  // await page.getByLabel('Wallet Name').fill('New Wallet');
  await page.locator('text=Wallet NameWallet Name >> input[type="text"]').fill('New Wallet');

  //And I click on the Next button
  await page.getByRole('button', { name: 'Next' }).click();
  //await page.locator('button:has-text("Next")').click();

  //And I save the Wallet ID of the wallet
  await page.waitForTimeout(10000);
  const deleteWallet = await page.$eval('[data-testid="LayoutDashboard-fingerprint"]', (el) => el.textContent);
  console.log(deleteWallet);
  const newlyDeleteWallet = deleteWallet.trim();

  //Then I am able to check the balance of that wallet
  await getWalletBalance(newlyDeleteWallet);

  //Given I logout of the new wallet
  await page.getByTestId('LayoutDashboard-log-out').click();

  //When I click on the mini menu for the new the wallet
  await page.locator(`[data-testid="SelectKeyItem-fingerprint-${newlyDeleteWallet}"] [aria-label="more"]`).click();

  //And I click the Delete option and click Back button
  await page.locator('p:has-text("Delete")').click();
  await page.locator('button:has-text("Back")').click();

  //And I click the Delete option and confirm by typing wallet id
  await page.locator(`[data-testid="SelectKeyItem-fingerprint-${newlyDeleteWallet}"] [aria-label="more"]`).click();
  await page.locator('p:has-text("Delete")').click();
  await page.locator('input[type="text"]').fill(newlyDeleteWallet);

  //Then I can click Delete button on Wallet
  await page.locator('button:has-text("Delete"):right-of(button:has-text("Back"))').click();

  //And New Wallet is successfully deleted
  await page.locator('button:has-text("Jahi 1st Wallet1922132445")').click();
  await page.locator('[data-testid="LayoutDashboard-log-out"]').click();
  expect(
    await page.locator(`[data-testid="SelectKeyItem-fingerprint-${newlyDeleteWallet}"] [aria-label="more"]`).count()
  ).toEqual(0);

  //

  // await page.getByTestId('SelectKeyItem-fingerprint-1362932744').getByRole('button', { name: 'more', exact: true }).click();
  // await page.getByText('Delete', { exact: true }).click();
  // await page.getByRole('heading', { name: 'Delete key 1362932744' }).click();
  // await page.getByLabel('Wallet Fingerprint').click();
  // await page.getByLabel('Wallet Fingerprint').fill('1362932744');
  // await page.getByRole('button', { name: 'Delete' }).click();
});
