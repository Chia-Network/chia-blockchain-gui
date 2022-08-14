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

//Works and Passes
test.only('Confirm user can navigate and interact the Settings page in user acceptable manner. ', async () => {

  //Given I navigate to 1651231316 Wallet
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('div[role="button"]:has-text("Private key with public fingerprint 1922132445Can be backed up to mnemonic seed")').click()
  ]);

  // And I click on the Setting's Gear
  await page.locator('div[role="button"]:has-text("Settings")').click();
  // assert.equal(page.url(), 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/settings');

  // Then I can confirm Wallet page loads
  await page.locator('button:has-text("Wallet")').click();

  // And I confirm that Farming app loads
  await page.locator('text=Farming').click();

  // And I confirm that Dark theme works 
  await page.locator('text=Dark').click();

  // And I confirm that Light theme works 
  await page.locator('text=Light').click();

  // And I confirm the user can select a language 
  await page.locator('button:has-text("English")').click();

  // Confirmation of Language
  await page.locator('text=English').nth(1).click();

  // Click text=Frequently Asked Questions
  await page.locator('text=Frequently Asked Questions').click();

  // Then I can confirm Wallet page loads
  await page.locator('data-testid=ExitToAppIcon').click();



});

//PASSPHRASE STUFF DOESN'T APPEAR TO BE AVAILABLE AS OF 8/7/22
//   // Given I open the Set Passphrase Dialog 
//   await page.locator('text=Set Passphrase').click();

//   // Then I can cancel page without error
//   await page.locator('text=Cancel').click();

//   //*************************************** USER SCENARIO: Confirm User can set a new Passphrase **************************/
  
//   // Given I open the Set Passphrase dialog page
//   await page.locator('text=Set Passphrase').click();

//   // When I enter a passphrase
//   await page.locator('[placeholder="Passphrase"]').fill('mytestpassphrase');

//   // And I click enter without adding text to confirm passphrase
//   await page.locator('[placeholder="Passphrase"]').press('Enter');

//   // Then reminder dialog displays
//   await page.locator('button:has-text("OK")').click();

//   // When I click inside of confirm passphrase field 
//   await page.locator('[placeholder="Confirm Passphrase"]').click();

//   // And I enter the wrong passphrase
//   await page.locator('[placeholder="Confirm Passphrase"]').fill('mytestpass');

//   // And I enter the wrong passphrase
//   await page.locator('[placeholder="Confirm Passphrase"]').press('Enter');

//   // Then warning dialog displays
//   await page.locator('button:has-text("OK")').click();

//   // When I click inside of confirm passphrase field 
//   await page.locator('[placeholder="Confirm Passphrase"]').click();

//   // And I enter the correct passphrase
//   await page.locator('[placeholder="Confirm Passphrase"]').fill('mytestpassphrase');

//   // And I press enter 
//   await page.locator('[placeholder="Confirm Passphrase"]').press('Enter');

//   // Then Set Passphrase confirmation page displays
//   await page.locator('button:has-text("OK")').click();

// //*************************************** USER SCENARIO: Confirm User can Remove a Passphrase **************************/
//   // Given I click Change Passphrase
//   await page.locator('text=Change Passphrase').click();

//   // Then I click Cancel Button on Passphrase
//   await page.locator('text=Cancel').click();

//   // Given I click Remove Passphrase
//   await page.locator('text=Remove Passphrase').click();

//   // When I enter the correct Passphrase
//   await page.locator('input[type="password"]').fill('mytestpassphrase');

//   // Then I can remove the pass passphrase
//   await page.locator('div[role="dialog"] button:has-text("Remove Passphrase")').click();

//   // And I confirm the passphrase was removed
//   await page.locator('button:has-text("OK")').click();

// /*

//   // Click text=Change Passphrase
//   await page.locator('text=Change Passphrase').click();

//   // Click text=Cancel
//   await page.locator('text=Cancel').click();

//   // Click text=Remove Passphrase
//   await page.locator('text=Remove Passphrase').click();

//   // Click text=Cancel
//   await page.locator('text=Cancel').click();

   // Click text=Send Feedback
  //  await page.locator('text=Send Feedback').click();
  //  const pageFeedback = page.locator('text=Send Feedback');
  //  await expect(pageFeedback).toHaveAttribute('a', 'Send Feedback');





