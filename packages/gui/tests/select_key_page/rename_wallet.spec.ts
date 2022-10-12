import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import { isWalletSynced, getWalletBalance } from '../utils/wallet';
import { waitForDebugger } from 'inspector';

let electronApp: ElectronApplication;
let page: Page;


test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  
});

test.beforeEach(async () => {
   // Given I enter correct credentials in Passphrase dialog
   await new LoginPage(page).login('password2022!@')

   // Logout of the wallet_new
   await page.locator('[data-testid="ExitToAppIcon"]').click();

  });

test.afterAll(async () => {
  await page.close();
});

test('Verify that renaming work and canceling the renaming wallet flow works.', async () => {
    const orgName = "Jahi 1st Wallet"
    const newName = "MyChiaMainWallet"

    //Given I click on miniMenu on a Wallet name
    await page.locator('[data-testid="SelectKeyItem-fingerprint-1922132445"] [aria-label="more"]').click();

    //And I click on rename option 
    await page.locator('text=Rename').click();

    //And I enter a new Name 
    await page.locator('[data-testid="SelectKeyRenameForm-label"]').fill(newName);

    //When I cancel/esc rename option 
    await page.locator('[aria-label="cancel"]').click();

    //Then previous name is still displaying
    await expect(page.locator(`h6:has-text("${orgName}")`)).toBeVisible()

    //Given I rename the Wallet and save
    await page.locator('[data-testid="SelectKeyItem-fingerprint-1922132445"] [aria-label="more"]').click();
    await page.locator('text=Rename').click();
    await page.locator('[data-testid="SelectKeyRenameForm-label"]').fill(newName);
    await page.locator('[data-testid="SelectKeyRenameForm-save"]').click();

    //Then new name displays inside of App
    await page.waitForTimeout(10000)
    await page.locator('[data-testid="SelectKeyItem-fingerprint-1922132445"]').click();
    await expect(page.locator(`text=${newName}`)).toBeVisible()
    await page.locator('[data-testid="ExitToAppIcon"]').click();

    //And new name displays on select page
    await expect(page.locator(`h6:has-text("${newName}")`)).toBeVisible()
    expect(await page.locator(`h6:has-text("${orgName}")`).count()).toEqual(0)
    
    //Reset Test Data
    await page.locator('[data-testid="SelectKeyItem-fingerprint-1922132445"] [aria-label="more"]').click();
    await page.locator('text=Rename').click();
    await page.locator('[data-testid="SelectKeyRenameForm-label"]').fill(orgName);
    await page.locator('[data-testid="SelectKeyRenameForm-save"]').click();
    await expect(page.locator(`h6:has-text("${orgName}")`)).toBeVisible()
    
});


 

 





