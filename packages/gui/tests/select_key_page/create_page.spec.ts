import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import { isWalletSynced, getWalletBalance } from '../utils/wallet';
import { waitForDebugger } from 'inspector';

let electronApp: ElectronApplication;
let page: Page;


test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  //electronApp = await electron.launch({ headless: true });
  page = await electronApp.firstWindow();
  
});

test.beforeEach(async () => {
    //Given I enter correct credentials in Passphrase dialog
    await new LoginPage(page).login('password2022!@')

   //Logout of the wallet_new
   await page.locator('[data-testid="ExitToAppIcon"]').click();

  });

test.afterAll(async () => {
  await page.close();
});

//Works
test('Create a new Wallet , logout and Delete new Wallet', async () => {

   //Given I click the Create New Private Key button 
   await page.locator('text=Create a new private key').click();

   //When I enter a Wallet Name
   await page.locator('text=Wallet NameWallet Name >> input[type="text"]').fill('New Wallet');

   //And I click on the Next button
   await page.locator('button:has-text("Next")').click()
  
   //And I save the Wallet ID of the wallet
   await page.waitForTimeout(10000)
   const deleteWallet= await page.$eval('[data-testid="LayoutDashboard-fingerprint"]', (el) => el.textContent);
   console.log(deleteWallet)
   const newlyDeleteWallet = deleteWallet.trim()

   //Then I am able to check the balance of that wallet
   await getWalletBalance(newlyDeleteWallet)
  
   //Given I logout of the new wallet
   await page.locator('[data-testid="ExitToAppIcon"]').click();

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
   await page.locator('button:has-text("Delete"):right-of(button:has-text("Back"))').click()

   //And New Wallet is successfully deleted
   await page.locator('button:has-text("Jahi 1st Wallet1922132445")').click();
   await page.locator('[data-testid="LayoutDashboard-log-out"]').click();
   expect(await page.locator(`[data-testid="SelectKeyItem-fingerprint-${newlyDeleteWallet}"] [aria-label="more"]`).count()).toEqual(0);


});





