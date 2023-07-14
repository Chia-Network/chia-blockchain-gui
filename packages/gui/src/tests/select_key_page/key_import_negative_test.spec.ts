import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';

import { CloseDialog } from '../data_object_model/close_dialog';
import { ReadData } from '../data_object_model/read_data_file';

let electronApp: ElectronApplication;
let page: Page;

const dataFile = require('../data_fixtures/data.json');

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

// PASSED AS OF 7/9/23
test('Read data from Json file', async () => {
  // Pre-requisites to get user back to Wallet selection page
  await new CloseDialog(page).closeIt();

  // Given I navigate to the Import Existing page
  await page.getByRole('button', { name: 'Add wallet' }).click();
  await page.getByText('Import Existing').click();

  // When I enter the wallet name
  await page.getByLabel('Wallet Name').click();
  await page.getByLabel('Wallet Name').fill('New Wallet');

  // And I enter the first 24 words of the mnemonic
  await new ReadData(page).get24Words();

  // And I click the Import button
  await page.getByRole('button', { name: 'Next' }).click();

  // Then user should receive an error message
  await expect(page.locator('text=Invalid order of mnemonic words')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();

  /** *************************************************SECOND SCENARIO************************************* */

  // Given I click on IMPORT FROM 12 WORD MNEMONIC
  await page.getByRole('button', { name: 'Import from 12 word mnemonic' }).click();

  // Verify user is on the Enter 12 Mnemonics page
  await expect(
    page.getByRole('heading', {
      name: 'Enter the 12 word mnemonic that you have saved in order to restore your Chia wallet.',
    })
  ).toBeVisible();

  // When I enter the first 12 words of the mnemonic
  await new ReadData(page).get12Words();

  // And I click the NEXT button
  await page.getByRole('button', { name: 'Next' }).click();

  // Then user should receive an error message
  await expect(page.locator('text=Invalid order of mnemonic words')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
});
