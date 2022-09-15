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
test('Confirm user can navigate and interact the Settings page in user acceptable manner. ', async () => {

  // //NOTE: Playwright doesn't appear to capture any data within the loading dialog
  // // Given Data Layer is enable upon loading Chia
  // await expect(page.locator('text=Data Layer')).toBeVisible;

  // // //  And Data Layer File Propagation Server is enable upon loading Chia
  // await expect(page.locator('text=Data Layer File Propagation Server')).toBeVisible;

  // Given I navigate to the Setting's Gear
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();

  // When I click on the Data Layer Tab
  await page.locator('[data-testid="Settings-tab-datalayer"]').click();

  // And I uncheck Data Layer checkbox 
  await page.locator('input[type="checkbox"]').first().uncheck();

  // Then the File Propagation checkbox is Hidden
  await expect(page.locator('text=Enable File Propagation Server')).toBeHidden();
  
  // When I log out and back in
  await page.close();
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();

  // And I navigate back to Data layer tab 
  await page.locator('[data-testid="DashboardSideBar-settings"]').click();
  await page.locator('[data-testid="Settings-tab-datalayer"]').click();
  
  // Then I re-enable Data Layer checkbox
  await page.locator('input[type="checkbox"]').check();

  // And the File Propagation checkbox is now Visible
  await expect(page.locator('text=Enable File Propagation Server')).toBeVisible();

});


