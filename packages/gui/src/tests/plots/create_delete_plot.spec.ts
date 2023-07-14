import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

// BROWERS FEATURE WILL BE CHANGING. WILL IMPEMENT THIS AFTER!!
test('Confirm can Create and Delete a Plot. ', async () => {
  // Pre-requisites to get user back to Wallet selection page
  await page.locator('button:has-text("Close")').click();

  // Given I navigate to a Wallet
  await page.locator('h6:has-text("playwright")').click();

  // And I click on the Plots Icon
  await page.getByTestId('DashboardSideBar-plots').click();

  // And I click on ADD A PLOT
  await page.getByRole('button', { name: '+ Add a Plot' }).click();

  // When I add a Plot Size
  await page.getByRole('button', { name: 'Chia Proof of Space 1.0.11' }).click();
  await page.getByRole('option', { name: 'Chia Proof of Space 1.0.11' }).click();

  // And I set the location
  await page.getByRole('button', { name: 'Browse' }).first().click();
  await page.on('dialog', (dialog) => dialog.accept());

  //

  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('button', { name: '🧜 Jahi 1st Wallet 1922132445 more' }).click();

  // await page.getByLabel('Temporary folder location *').click();
  // await page.getByLabel('Final folder location *').click();
  // await page.locator('div').filter({ hasText: 'Final folder location * Selected' }).getByRole('button', { name: 'Selected' }).click();
  // await page.locator('#mui-component-select-p2SingletonPuzzleHash').click();
  // await page.getByRole('option', { name: 'Maroon Narwhal' }).click();
  // await page.getByRole('button', { name: 'Create' }).click();
  // await page.getByRole('row', { name: 'K-32, 101.348 GiB 0x8fa56b619e3b6d05c83412f839289dc1d90c4f92ab46ce98fd1b5b4309ab656bae6c92ab8b9769efbf1d31825c3eb647 txch17j7llengm98vtsdr03x0nz92l73hhszz58celd34vc68y69th5xsjg8f6d /Users/jahifaw/Downloads/plot-k32-2023-02-22-14-24-292325f6852d3b371917b32701e832fba2a333cedf73ce3b8845faff94b34983.plot Not Available more' }).getByRole('button', { name: 'more' }).click();
  // await page.getByRole('menuitem', { name: 'Delete' }).click();
  // await page.getByRole('button', { name: 'Delete' }).click();

  // await page.locator('#mui-component-select-p2SingletonPuzzleHash').click();
  // await page.getByRole('option', { name: 'Orange Peafowl' }).click();

  await page.locator('div').filter({ hasText: 'Add a Plot' }).getByRole('button').click();
  await page.getByText('You have made changes. Do you want to discard them?').click();
  await page.getByRole('button', { name: 'Discard' }).click();
});
