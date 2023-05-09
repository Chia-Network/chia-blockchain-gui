import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { CloseDialog } from '../data_object_model/close_dialog';
import { ReadData } from '../data_object_model/read_data_file';


let electronApp: ElectronApplication;
let page: Page;

let dataFile = require('../data_fixtures/data.json');

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Read data from Json file and Paste in Mnemonic', async () => {
  //Pre-requisites to get user back to Wallet selection page
  await new CloseDialog(page).closeIt();

  // Given I navigate to the Import Existing page
  await page.getByRole('button', { name: 'Add wallet' }).click();
  await page.getByText('Import Existing').click();

  //When I enter the wallet name
  await page.getByLabel('Wallet Name').click();
  await page.getByLabel('Wallet Name').fill('Paste New Wallet');

  //And I click on PASTE MNEMONIC
  await page.getByRole('button', { name: 'Paste Mnemonic' }).click();

  await page.pause();
  //And I enter the first 24 words of the mnemonic
  //await new ReadData(page).pasteWords();
  await page.locator('#mui-51').fill(' "abandon" "ability" "able" "about" "above" "absent" "baby" "bachelor" "bacon" "badge" "bag" "balance" "cabbage" "cabin" "cable" "cactus" "cage" "cake" "dad" "damage" "damp" "dance" "danger" "daring"');

  //And I click the Cancel on Import
  await page.getByRole('button', { name: 'Cancel' }).click();
  
  //And I click on PASTE MNEMONIC and complete Import process
  await page.getByRole('button', { name: 'Paste Mnemonic' }).click();
  //await page.locator('#mui-52').fill(' "abandon" "ability" "able" "about" "above" "absent" "baby" "bachelor" "bacon" "badge" "bag" "balance" "cabbage" "cabin" "cable" "cactus" "cage" "cake" "dad" "damage" "damp" "dance" "danger" "daring"');
  await new ReadData(page).pasteWords();
  await page.getByRole('button', { name: 'Import' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  //Then user should receive an error message
  await expect(page.locator('text=Invalid order of mnemonic words')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  
});
