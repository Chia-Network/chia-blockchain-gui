import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';

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

  });

  test.afterAll(async () => {
    await page.close();
  });

//Works and Passes
test('Confirm user can navigate and interact the Settings page in user acceptable manner. ', async () => {
  
  //Pre-requisites to get user back to Wallet selection page
  await page.locator('[data-testid="LayoutDashboard-log-out"]').click();

  //Given I navigate to 1922132445 Wallet
  await page.locator('h6:has-text("Jahi 1st Wallet")').click()

  //When I click on the Setting's Gear
  await page.locator('div[role="button"]:has-text("Settings")').click();
  
  //Then I can confirm Wallet page loads
  await page.locator('[data-testid="SettingsApp-mode-wallet"]').click();

  //And I confirm that Farming app loads
  await page.locator('[data-testid="SettingsApp-mode-farming"]').click();

  //And I confirm that Dark theme works 
  await page.locator('text=Dark').click();

  //And I confirm that Light theme works 
  await page.locator('text=Light').click();

  //And I confirm the user can select a language 
  await page.locator('button:has-text("English")').click();

  //Confirmation of Language
  await page.locator('text=English').nth(1).click();

  //Click text=Frequently Asked Questions
  await page.locator('text=Frequently Asked Questions').click();

  //Then I can confirm Wallet page loads
  await page.locator('data-testid=ExitToAppIcon').click();
  
});


