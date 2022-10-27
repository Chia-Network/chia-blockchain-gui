import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';

let electronApp: ElectronApplication;
let page: Page;

let dataFile = require('../data_fixtures/data.json');

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  //electronApp = await electron.launch({ headless: true });
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

test('Read data from Json file', async () => {
  // Confirm data is being pulled from JSON file
  console.log(dataFile);

  // Given I navigate to the Enter 24 Mnemonics page
  await page.locator('[data-testid="SelectKey-import-from-mnemonics"]').click();

  let i = 0;

  while (i <= 24) {
    // When I enter the first 24 words of the mnemonic
    await page
      .locator('[data-testid={`mnemonic-${index}`}]')
      .fill(dataFile.First);
    i++;
  }

  // await page.locator('.sc-cxpSdN').first().fill(dataFile.First);
  // // Press Enter
  // await page.locator('.sc-cxpSdN').first().press('Enter');
  // // Click #mui-54
  // await page.locator('#mui-54').click();
  // // Fill #mui-54
  // await page.locator('#mui-54').fill('ability');

  // // Press Enter
  // await page.locator('#mui-54').press('Enter');
  // // Click div:nth-child(3) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(3) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-56
  // await page.locator('#mui-56').fill('able');
  // // Press Enter
  // await page.locator('#mui-56').press('Enter');
  // // Press Tab
  // await page.locator('#mui-56').press('Tab');
  // // Click div:nth-child(4) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(4) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-58
  // await page.locator('#mui-58').fill('about');
  // // Press Enter
  // await page.locator('#mui-58').press('Enter');
  // // Click div:nth-child(5) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(5) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-60
  // await page.locator('#mui-60').fill('above');
  // // Press Enter
  // await page.locator('#mui-60').press('Enter');
  // // Click div:nth-child(6) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(6) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-62
  // await page.locator('#mui-62').fill('absent');
  // // Press Enter
  // await page.locator('#mui-62').press('Enter');
  // // Click div:nth-child(7) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(7) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-64
  // await page.locator('#mui-64').fill('abstract');
  // // Press Enter
  // await page.locator('#mui-64').press('Enter');
  // // Click div:nth-child(8) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(8) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-66
  // await page.locator('#mui-66').fill('absurd');
  // // Press Enter
  // await page.locator('#mui-66').press('Enter');
  // // Click div:nth-child(9) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(9) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-68
  // await page.locator('#mui-68').fill('abuse');
  // // Press Enter
  // await page.locator('#mui-68').press('Enter');
  // // Click div:nth-child(10) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(10) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-70
  // await page.locator('#mui-70').fill('access');
  // // Press Enter
  // await page.locator('#mui-70').press('Enter');
  // // Click div:nth-child(11) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(11) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-72
  // await page.locator('#mui-72').fill('accident');
  // // Press Enter
  // await page.locator('#mui-72').press('Enter');
  // // Click div:nth-child(12) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(12) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-74
  // await page.locator('#mui-74').fill('account');
  // // Press Enter
  // await page.locator('#mui-74').press('Enter');
  // // Click div:nth-child(13) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(13) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-76
  // await page.locator('#mui-76').fill('accuse');
  // // Press Enter
  // await page.locator('#mui-76').press('Enter');
  // // Click div:nth-child(14) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(14) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-78
  // await page.locator('#mui-78').fill('achieve');
  // // Press Enter
  // await page.locator('#mui-78').press('Enter');
  // // Click div:nth-child(15) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(15) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-80
  // await page.locator('#mui-80').fill('acid');
  // // Press Enter
  // await page.locator('#mui-80').press('Enter');
  // // Click div:nth-child(16) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(16) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-82
  // await page.locator('#mui-82').fill('acoustic');
  // // Press Enter
  // await page.locator('#mui-82').press('Enter');
  // // Click div:nth-child(17) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(17) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-84
  // await page.locator('#mui-84').fill('acquire');
  // // Press Enter
  // await page.locator('#mui-84').press('Enter');
  // // Click div:nth-child(18) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(18) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-86
  // await page.locator('#mui-86').fill('across');
  // // Press Enter
  // await page.locator('#mui-86').press('Enter');
  // // Click div:nth-child(19) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(19) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-88
  // await page.locator('#mui-88').fill('act');
  // // Press Enter
  // await page.locator('#mui-88').press('Enter');
  // // Click div:nth-child(20) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(20) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Click text=action
  // await page.locator('text=action').click();
  // // Click div:nth-child(21) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(21) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-92
  // await page.locator('#mui-92').fill('actor');
  // // Press Tab
  // await page.locator('#mui-92').press('Tab');
  // // Click div:nth-child(22) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(22) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-94
  // await page.locator('#mui-94').fill('actress');
  // // Press Enter
  // await page.locator('#mui-94').press('Enter');
  // // Click div:nth-child(23) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(23) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-96
  // await page.locator('#mui-96').fill('actual');
  // // Press Enter
  // await page.locator('#mui-96').press('Enter');
  // // Click div:nth-child(24) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV
  // await page.locator('div:nth-child(24) > .sc-lcepkR > .sc-jcFjpl > .sc-iwjdpV').click();
  // // Fill #mui-98
  // await page.locator('#mui-98').fill('adapt');
  // // Press Enter
  // await page.locator('#mui-98').press('Enter');
});

// test('Verify that user can read data from file. ', async ({request}) => {

//   //Given I read data from a file

//   //When I store that data into a variable

//   //Then I can print the contents of the variable to console

// ///**********************************NODE WAY OF FILE IMPORTING */
// // const fs = require('fs')
// // fs.readFile('../tests/data.json', (err, jsonString) => {
// //     if (err) {
// //         console.log("Error reading file from disk:", err)
// //         return
// //     }
// //     try {
// //         const customer = JSON.parse(jsonString)
// //         console.log("Customer address is:", customer) // => "Customer address is: Infinity Loop Drive"
// // } catch(err) {
// //         console.log('Error parsing JSON string:', err)
// //     }
// // })

// ///**********************************NODE WAY OF FILE IMPORTING */
// // const fs = require("fs");
// // fs.readFile("./data.json", "utf8", (err, jsonString) => {
// //   if (err) {
// //     console.log("File read failed:", err);
// //     return;
// //   }
// //   console.log("File data:", jsonString);
// // });

// ///**********************************PLAYWRIGHT WAY OF FILE IMPORTING */
// // // Click .sc-iwjdpV >> nth=0
// // await page.locator('.sc-iwjdpV').first().click();
// // // Fill #mui-50
// // await page.locator('#mui-50').fill('abandon');
// // // Press Enter
// // await page.locator('#mui-50').press('Enter');

// //await page.locator('.sc-iwjdpV').setInputFiles('./data.json')

// ///**********************************TRIAL AND ERROR */
// // const fs = require("fs");
// // fs.readFile("./data.json",() => {

// // });

// // const resp = JSON.parse(fs)
// // console.log(resp)

// //

// // const response = await request.get('./data.json')

// // const respBody = JSON.parse(await response.text())

// // console.log(mytest)

// ///**********************************PURE JAVASCRIPT APPROACH */

// });
