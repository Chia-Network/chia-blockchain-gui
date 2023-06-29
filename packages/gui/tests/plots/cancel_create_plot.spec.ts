import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

//Works and Passes
test('Confirm can Create and Delete a Plot. ', async () => {
  //Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();

  //Given I navigate to a Wallet
  await page.locator('h6:has-text("playwright")').click();

  //And I click on the Plots Icon
  await page.getByTestId('DashboardSideBar-plots').click();

  //And I click on ADD A PLOT
  await page.getByRole('button', { name: '+ Add a Plot' }).click();

  //When I add a Plot to a Plot NFT
  await page.locator('#mui-component-select-p2SingletonPuzzleHash').click();
  await page.getByRole('option', { name: 'Orange Peafowl' }).click();

  //Then I can Discard Plot Creation
  //await page.getByText('You have made changes. Do you want to discard them?').click();
  //await page.locator('div').filter({ hasText: 'Add a Plot' }).getByRole('button').click();
  await page.locator('[data-testid="ArrowBackIosNewIcon"]').click();
  await page.getByRole('button', { name: 'Discard' }).click();
});
