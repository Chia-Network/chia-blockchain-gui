import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';
import { dialog } from 'electron';

let electronApp: ElectronApplication;
let page: Page;


test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  //electronApp = await electron.launch({ headless: true });
  page = await electronApp.firstWindow();
  
});

test.afterAll(async () => {
  await electronApp.close();
});

//Incomplete broke do to Element changing
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
  expect(text).toContain('Create Transaction');
  
  // Click button:has-text("ChiaXCH")
  await page.locator('button:has-text("ChiaXCH")').click();
  //assert.equal(page.url(), 'file:///Users/jahifaw/Documents/Code/Chia-App/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1');
 
  // Click #mui-26
  await page.locator('#mui-26').click();

  // Click button:has-text("Manage token list")
  await page.locator('button:has-text("Manage token list")').click(); 

});

//Incomplete broke do to Element changing
test('Confirm fields Provide Tooltips on Send Page for 1651231316 ID', async () => {
  
  // Click div[role="button"]:has-text("Private key with public fingerprint 1651231316Can be backed up to mnemonic seed")
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('div[role="button"]:has-text("Private key with public fingerprint 1651231316Can be backed up to mnemonic seed")').click()
  ]);

  // Click text=Send
  await page.locator('text=Send').click();

  // Click text=Actions
  await page.locator('text=Actions').click();

 // Click div[role="presentation"] div >> nth=0
  await page.locator('div[role="presentation"] div').first().click();

  // Click Address and Puzzle Hash field
  await page.waitForNavigation();
  await page.locator('#mui-35').click();

  // Fill text=Amount *TXCH >> input[type="text"]
  await page.locator('text=Amount *TXCH >> input[type="text"]').fill('34');


   // Fill text=FeeTXCH >> input[type="text"]
   await page.locator('text=FeeTXCH >> input[type="text"]').fill('0.8');

   //assertion for Value
   const visual = await page.$eval('.sc-hKwDye.Fee__StyledWarning-sc-1qxwx6o-0.bNqlcC.MuiBox-root', (el) => el.textContent);
   expect(visual).toContain('Value seems high');
   expect(visual).toEqual('Value seems high')
   //expect(visual).toEqual('Value Jahi seems high') Test that confirmed previous step actually verifies something

   //Click #mui-30
  await page.locator('#mui-30').click();

   // Click button:has-text("Manage token list")
   await page.locator('button:has-text("Manage token list")').click();

});

//Failures due to Elements changing attributes
test('Confirm Error Dialog when wrong data is entered on Send Page for 1651231316 ID', async () => {
  
  // Click div[role="button"]:has-text("Private key with public fingerprint 1651231316Can be backed up to mnemonic seed")
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('div[role="button"]:has-text("Private key with public fingerprint 1651231316Can be backed up to mnemonic seed")').click()
  ]);

  // Click text=Send
  await page.locator('text=Send').click();

  // Fill #mui-29
  await page.locator('#mui-29').fill('1');

  // Fill text=Amount *TXCH >> input[type="text"]
  await page.locator('text=Amount *TXCH >> input[type="text"]').fill('34');


   // Fill text=FeeTXCH >> input[type="text"]
   await page.locator('text=FeeTXCH >> input[type="text"]').fill('0.8');

  // Click #mui-30
  await page.locator('#mui-30').click();

  // Click div[role="dialog"] >> text=OK
  await expect(page.locator('div[role="dialog"]')).toHaveText('ErrorWallet needs to be fully synced before sending transactionsOK');
  await page.locator('div[role="dialog"] >> text=OK').click();
  

});

//Works
test.only('Create new Wallet and logout', async () => {

  // Click text=Create a new private key
  await page.locator('text=Create a new private key').click();
  // assert.equal(page.url(), 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/wallet/add');

  // Click button:has-text("Next")
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('button:has-text("Next")').click()
  ]);

   //Grab the wallet id 
   const wallet_new = await page.innerText('.sc-iqseJM.iAUiTX.MuiTypography-root.MuiTypography-h5.LayoutDashboard__StyledInlineTypography-sc-1nay716-5.jVcyEI')
   
   //console.log(wallet_new)
   console.log(wallet_new)

  // Click text=Receive page
  await page.locator('text=Receive').click();

  const wallet_new_address = await page.locator('text=Receive Address New AddressAddress >> input[type="text"]').inputValue() //.click();

  console.log(wallet_new_address)


  // Logout of the wallet_new
  await page.locator('[data-testid="ExitToAppIcon"]').click();

  // Click text=Wallet 1463910308Syncing Connected (3) >> button >> nth=2
  await page.locator(`text=Wallet ${wallet_new}Syncing Connected (3) >> button`).nth(2).click();
  // assert.equal(page.url(), 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/');
  // Click [aria-label="delete"] >> nth=2
  await page.locator('[aria-label="delete"]').nth(2).click();


  /*/Log into wallet_test_funds
  await page.locator('text=1651231316').click();


  // Click text=Send page
  await page.locator('text=Send').click();


   // Fill Address/Puzzle has* field
   await page.locator('.sc-iwjdpV.sc-giYglK.lmVqSL.bAAoFy.MuiFilledInput-input.MuiInputBase-input').fill(wallet_new_address);

    // Fill text=Amount *TXCH >> input[type="text"]
  await page.locator('text=Amount *TXCH >> input[type="text"]').fill('.00001');


  // Fill text=FeeTXCH >> input[type="text"]
  await page.locator('text=FeeTXCH >> input[type="text"]').fill('.00005');

  await page.locator('button:has-text("Send")').hover */

});



