import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';

let electronApp: ElectronApplication;
let page: Page;

let dataFile = require('../data_fixtures/data.json');

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.beforeEach(async () => {
  //Given I enter correct credentials in Passphrase dialog
  await new LoginPage(page).login('password2022!@');

  //Logout of the wallet_new
  await page.locator('[data-testid="ExitToAppIcon"]').click();
});

test.afterAll(async () => {
  await page.close();
});

// NEEDS WORK TO FINISH
test('Read data from Json file', async () => {
  // Confirm data is being pulled from JSON file
  console.log(dataFile);

  // Given I navigate to the Enter 24 Mnemonics page
  await page.locator('[data-testid="SelectKey-import-from-mnemonics"]').click();

  let i = 0;

  while (i <= 24) {
    let x = JSON.stringify(i);
    let dataVariable = JSON.stringify(dataFile[x]);
    // Given I enter the first 24 words of the mnemonic
    await page
      .locator(`[data-testid="mnemonic-${i}"] input[role="combobox"]`)
      .fill(dataVariable);
    i++;
  }
});
