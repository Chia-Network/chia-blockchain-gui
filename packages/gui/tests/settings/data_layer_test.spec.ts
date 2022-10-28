import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import ChildProcess from 'child_process';
import { stopAllChia } from '../utils/wallet';

let electronApp: ElectronApplication;
let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
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
test('Confirm user can navigate and interact with the Settings page in user acceptable manner. ', async () => {

  //Given I navigate to the Setting's Gear
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();

  //When I click on the Data Layer Tab
  await page.locator('[data-testid="Settings-tab-datalayer"]').click();

  //And I uncheck Data Layer checkbox 
  await page.locator('input[type="checkbox"]').first().uncheck();

  //Then the File Propagation checkbox is Hidden
  await expect(page.locator('text=Enable File Propagation Server')).toBeHidden();
  
  //When I log out and back in
  await page.close();
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();

  //And I navigate back to Data layer tab 
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();
  await page.locator('[data-testid="Settings-tab-datalayer"]').click();
  
  //Then I re-enable Data Layer checkbox
  await page.locator('input[type="checkbox"]').check();

  //And the File Propagation checkbox is now Visible
  await expect(page.locator('text=Enable File Propagation Server')).toBeVisible();

  //Stop Chia 
  await page.close();
  stopAllChia()

});


