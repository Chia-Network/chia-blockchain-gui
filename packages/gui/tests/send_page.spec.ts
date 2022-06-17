import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';
import { dialog } from 'electron';

let electronApp: ElectronApplication;
let page: Page;


test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  
});

test.afterAll(async () => {
  await electronApp.close();
});

test('Interact with Send Page Elements', async () => {
  //const page = await electronApp.firstWindow();
  await page.locator('text=1054108904').click();
  expect(page).toHaveTitle('Chia Blockchain');

 // Click text=Send
  await page.locator('text=Send').click();

  // Click text=Actions
  await page.locator('text=Actions').click();

  // Click div[role="presentation"] div >> nth=0
  await page.locator('div[role="presentation"] div').first().click();

  // Click text=Amount *XCH >> input[type="text"]
  await page.locator('text=Amount *XCH >> input[type="text"]').click();

  // Click text=FeeXCH >> input[type="text"]
  await page.locator('text=FeeXCH >> input[type="text"]').click();

  const text = await page.$eval('h6', (el) => el.textContent);
  //expect(text).toEqual('Create Transaction');
  expect(text).toContain('Create Transaction');
  
  // Click button:has-text("ChiaXCH")
  await page.locator('button:has-text("ChiaXCH")').click();
  //assert.equal(page.url(), 'file:///Users/jahifaw/Documents/Code/Chia-App/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1');
 
  // Click #mui-26
  await page.locator('#mui-26').click();

  // Click button:has-text("Manage token list")
  await page.locator('button:has-text("Manage token list")').click(); 

});

test.only('Interact with the Send Page Elements for 1651231316 ID', async () => {
  
  // Click div[role="button"]:has-text("Private key with public fingerprint 1651231316Can be backed up to mnemonic seed")
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('div[role="button"]:has-text("Private key with public fingerprint 1651231316Can be backed up to mnemonic seed")').click()
  ]);

  // Click text=Send
  await page.locator('text=Send').click();

  // Click #mui-29
  await page.locator('#mui-29').click();

  // Fill text=Amount *TXCH >> input[type="text"]
  await page.locator('text=Amount *TXCH >> input[type="text"]').fill('34');


   // Fill text=FeeTXCH >> input[type="text"]
   await page.locator('text=FeeTXCH >> input[type="text"]').fill('0.8');

   //assertion for Value
   const visual = await page.$eval('.sc-hKwDye.Fee__StyledWarning-sc-1qxwx6o-0.bNqlcC.MuiBox-root', (el) => el.textContent);
   expect(visual).toContain('Value seems high');
   expect(visual).toEqual('Value seems high')
   //expect(visual).toEqual('Value Jahi seems high') Test that confirmed previous step actually verifies something

  // Click #mui-30
  await page.locator('#mui-30').click();

  const pageAlert = await page.$('.tooltip');
 await expect(pageAlert).toEqual('Success message');

  /*let toolTip = document.querySelector('.tooltip');
  expect(toolTip).not.toBe(null);*/

  //await page.locator('text=Please fill out this Jahis field').isVisible

  //assertion for Dialog
  /*page.on('dialog', async (dialog) =>{
    expect(dialog.message()).toEqual('Please fill out this field.')
    expect(dialog.message()).toEqual('Please fill out Jahis field.')
  })*/

 // page.on('dialog', dialog => expect(dialog.message()).toEqual('Please fill out Jahis field.'))
 // await expect(page.$('.alert')).toEqual('Success message');

 //const pageAlert = await page.$('.alert');
 //await expect(pageAlert).toEqual('Success message');

  // Click button:has-text("Manage token list")
  await page.locator('button:has-text("Manage token list")').click();

  // Click text=Actions
  await page.locator('text=Actions').click();

});


/*


  // Click [placeholder="Search\.\.\."]
  await page.locator('[placeholder="Search\\.\\.\\."]').click();

  // Uncheck input[type="checkbox"] >> nth=0
  await page.locator('input[type="checkbox"]').first().uncheck();

  // Check input[type="checkbox"] >> nth=0
  await page.locator('input[type="checkbox"]').first().check();

  // Click text=NameName509deafe3cd8bbfbb9ccce1d930e3d7b57b40c964fa33379b18d628175eb7a8fSearch o >> input[type="text"]
  await page.locator('text=NameName509deafe3cd8bbfbb9ccce1d930e3d7b57b40c964fa33379b18d628175eb7a8fSearch o >> input[type="text"]').click();

  // Click text=NameName8ebf855de6eb146db5602f0456d2f0cbe750d57f821b6f91a8592ee9f1d4cf31Search o >> input[type="text"]
  await page.locator('text=NameName8ebf855de6eb146db5602f0456d2f0cbe750d57f821b6f91a8592ee9f1d4cf31Search o >> input[type="text"]').click();

  // Click text=NameName78ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1Search o >> input[type="text"]
  await page.locator('text=NameName78ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1Search o >> input[type="text"]').click();

  // Click text=NameName6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589Search o >> input[type="text"]
  await page.locator('text=NameName6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589Search o >> input[type="text"]').click();

  */