import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';

let electronApp: ElectronApplication;
let page: Page;
let wallet_new, wallet_new_address;

/*
test.beforeEach(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  //electronApp = await electron.launch({ headless: true });
  page = await electronApp.firstWindow();
  
});

test.afterEach(async () => {
  await electronApp.close();
});*/

//Works and Passes
test('Create new Wallet and logout', async () => {

  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  //electronApp = await electron.launch({ headless: true });
  page = await electronApp.firstWindow();

  // Click text=Create a new private key
  await page.locator('text=Create a new private key').click();
  // assert.equal(page.url(), 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/wallet/add');

  // Click button:has-text("Next")
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('button:has-text("Next")').click()
  ]);

   //Grab the wallet id 
   wallet_new = await page.innerText('.sc-iqseJM.iAUiTX.MuiTypography-root.MuiTypography-h5.LayoutDashboard__StyledInlineTypography-sc-1nay716-5.jVcyEI')
   
   //console.log(wallet_new)
   console.log(wallet_new)

  // Click text=Receive page
  await page.locator('text=Receive').click();

  wallet_new_address= await page.locator('text=Receive Address New AddressAddress >> input[type="text"]').inputValue() //.click();

  console.log(wallet_new_address)

  // Logout of the wallet_new
  await page.locator('[data-testid="ExitToAppIcon"]').click();

  await electronApp.close();

});

//****This feature does not work because it can't handle multi pages
// test('Open Funded Wallet assign funds to New Wallet', async () => {

//   // Click text=Create a new private key
//   await page.locator('text=Create a new private key').click();
//   // assert.equal(page.url(), 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/wallet/add');

//   // Click button:has-text("Next")
//   await Promise.all([
//     page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
//     page.locator('button:has-text("Next")').click()
//   ]);

//   // Click text=Receive page
//   await page.locator('text=Receive').click();

//   wallet_new_address= await page.locator('text=Receive Address New AddressAddress >> input[type="text"]').inputValue() //.click();

//   console.log(wallet_new_address)

//   // Logout of the wallet_new
//   await page.locator('[data-testid="ExitToAppIcon"]').click();

//  // await electronApp.close();

//   electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
//   //electronApp = await electron.launch({ headless: true });
//   page2 = await electronApp.firstWindow();

//    //Log into wallet_test_funds
//    await page2.locator('text=1651231316').click();


//   // Click text=Send page
//   await page2.locator('text=Send').click();


//    // Fill Address/Puzzle has* field
//    await page2.locator('.sc-iwjdpV.sc-giYglK.lmVqSL.bAAoFy.MuiFilledInput-input.MuiInputBase-input').fill(wallet_new_address);

//     // Fill text=Amount *TXCH >> input[type="text"]
//   await page2.locator('text=Amount *TXCH >> input[type="text"]').fill('.00001');

//   // Fill text=FeeTXCH >> input[type="text"]
//   await page2.locator('text=FeeTXCH >> input[type="text"]').fill('.00005');

//   await page2.locator('button:has-text("Send")').hover

// });

test.only('Verify that Funded wallet cannot send funds until fully synced', async () => {

  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  //electronApp = await electron.launch({ headless: true });
  page = await electronApp.firstWindow();

  const partner_wallet = 'txch1p8956yym9nvs6enfzpgs9spjf8wx435avemsq3k3fzgxnc9qvezqngy2a2'

  //Login To Account 
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('div[role="button"]:has-text("Private key with public fingerprint 1922132445Can be backed up to mnemonic seed")').click()
  ]);

  await page.locator('text=Wallet 1922132445').click();

  //Confirm Funds are not 0
  const myFunds = await page.$eval('.sc-bTfYFJ.gLEfkc.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-12.MuiGrid-grid-lg-4', (el) => el.textContent);
  console.log(myFunds)
  if(myFunds == 'Total Balance0 TXCH' ){
    console.log('No Funds Available!')
    //await electronApp.close();
  }

  else if (myFunds != 'Total Balance0 TXCH' ) {

    // Navigate to Send page
    await page.locator('text=Send').click();

    // Fill Address/Puzzle has* field
    //await page.locator('.sc-iwjdpV.sc-giYglK.lmVqSL.bAAoFy.MuiFilledInput-input.MuiInputBase-input').fill(partner_wallet);
    await page.locator('.sc-iwjdpV.sc-giYglK.daydxT.JOlSo.MuiFilledInput-input.MuiInputBase-input').fill(partner_wallet);

    // Fill text=Amount *TXCH >> input[type="text"]
    await page.locator('text=Amount *TXCH >> input[type="text"]').fill('.0005');

    // Fill text=FeeTXCH >> input[type="text"]
    await page.locator('text=FeeTXCH >> input[type="text"]').fill('.000005');

    const pageStatus = await page.$eval('.sc-hKwDye.dPcxQq.Flex__StyledGapBox-sc-1nzpt0b-0.crSgCj.StateIndicator__StyledFlexContainer-sc-3e28ts-0.bNWWRC.MuiBox-root', (el) => el.textContent);
    console.log(pageStatus)

    if (pageStatus == 'Not Synced'){
      console.log('You are Not Synced')

    }
    else if(pageStatus == 'Syncing'){
      // Click div[role="dialog"] >> text=OK
      await expect(page.locator('div[role="dialog"]')).toHaveText('ErrorWallet needs to be fully synced before sending transactionsOK' || 'ErrorPlease finish syncing before making a transactionOK');
      await page.locator('div[role="dialog"] >> text=OK').click();

    }
    else {
      //await expect(page.locator('div[role="dialog"]')).toHaveText('ErrorWallet needs to be fully synced before sending transactionsOK' || 'ErrorPlease finish syncing before making a transactionOK');
      console.log('Page is Synced!')
      //Add action to click button = await page.locator('form div:has-text("Send")').nth(1).click();
      //await page.locator('div[role="dialog"] >> text=OK').click();

    }
    

  }

  await electronApp.close();
  
});

//CURRENT ISSUES IS THAT THE SEND PAGE DOESN'T SYNC!
test('Make Transactions Between Wallet if Funds are available part 1', async () => {

  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  //electronApp = await electron.launch({ headless: true });
  page = await electronApp.firstWindow();

  const partner_wallet = 'txch1p8956yym9nvs6enfzpgs9spjf8wx435avemsq3k3fzgxnc9qvezqngy2a2'

  //Login To Account 
  //No funds Test await page.locator('text=558676071').click();
  //await page.locator('text=1651231316').click();
  await Promise.all([
    page.waitForNavigation(/*{ url: 'file:///Users/jahifaw/Documents/Code/Chia-testnet-playwright/chia-blockchain/chia-blockchain-gui/packages/gui/build/renderer/index.html#/dashboard/wallets/1' }*/),
    page.locator('div[role="button"]:has-text("Private key with public fingerprint 1651231316Can be backed up to mnemonic seed")').click()
  ]);

  await page.locator('text=Wallet 1651231316').click();

  /*/Confirm Funds are not 0
  Note that the element had grab the topmost class which why the two above did not work. */
  const myFunds = await page.$eval('.sc-bTfYFJ.gLEfkc.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-12.MuiGrid-grid-lg-4', (el) => el.textContent);
  console.log(myFunds)
  if(myFunds == 'Total Balance0 TXCH' ){
    console.log('No Funds Available!')
    //await electronApp.close();
  }

  else if (myFunds != 'Total Balance0 TXCH' ) {

    // Navigate to Send page
    await page.locator('text=Send').click();

    // Fill Address/Puzzle has* field
    await page.locator('.sc-iwjdpV.sc-giYglK.daydxT.JOlSo.MuiFilledInput-input.MuiInputBase-input').fill(partner_wallet);

    // Fill text=Amount *TXCH >> input[type="text"]
    await page.locator('text=Amount *TXCH >> input[type="text"]').fill('.0005');

    // Fill text=FeeTXCH >> input[type="text"]
    await page.locator('text=FeeTXCH >> input[type="text"]').fill('.000005');

    const pageStatus = await page.$eval('.sc-hKwDye.dPcxQq.Flex__StyledGapBox-sc-1nzpt0b-0.crSgCj.StateIndicator__StyledFlexContainer-sc-3e28ts-0.bNWWRC.MuiBox-root', (el) => el.textContent);
    console.log(pageStatus)
    
    await page.waitForSelector('button:has-text("Synced"):right-of(:text("Wallet 1651231316"))');

   /*if (await page.waitForSelector('button:has-text("Synced"):right-of(:text("Wallet 1651231316"))')){
    await page.locator('button:has-text("Send"):below(:text("FeeTXCH"))').click();
   }*/

   //('h5:has-text("Chia")')
   //await expect(page.locator("text=Synced")).toBeVisible()

   //(await page.waitForSelector("text=Not Synced")).isHidden

   await Promise.all([
    expect( page.waitForSelector("text=Not Synced")).not.toBeTruthy
  ]);

   if(page.locator('button:has-text("Not Synced"):right-of(:text("Wallet 1651231316"))')){
     console.log('Page is Not Synced!')
    // expect( page.waitForSelector("text=Not Synced")).not.toBeTruthy
   }
   else if(page.locator('button:has-text("Syncing"):right-of(:text("Wallet 1651231316"))')){
    console.log('Page is Not Syncing!')
   }
   else{
     console.log('Page has Synced! Finally')
   }

  }
  await electronApp.close();
  
});

