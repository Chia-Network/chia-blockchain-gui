import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test';
import { LoginPage } from '../data_object_model/passphrase_login';
import { SendFunds  } from '../data_object_model/send_funds';

let electronApp: ElectronApplication;
let page: Page;
let appWindow: Page;


test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
  
});

test.afterAll(async () => {
  await page.close();

});

  test('Verify that receiving wallet receives funds from send wallet!', async () => {

    let receive_wallet = 'txch1u237ltq0pp4348ppwv6cge7fks87mn4wz3c0ywvgswvpwhkqqn8qn8jeq6'
    let send_wallet = 'txch160r38yfdqfeplderp7tf8zm7u8tv48vm0qd3rs3r2kp4yw4ahl8qd27qrr'

    // Given I enter correct credentials in Passphrase dialog
    await new LoginPage(page).login('password2022!@')

    // And I navigate to a wallet with funds
    await page.locator('[data-testid="LayoutDashboard-log-out"]').click();
    await page.locator('text=1922132445').click();
   // await page.waitForSelector('svg:has-text("3AAC59"):near(:text("Wallet"))');

    // And I check the balance of current wallet
    //await new SendFunds(page).check_balance()

    // And I click on Send Page
    await page.locator('[data-testid="WalletHeader-tab-send"]').click();

    // When I complete the send page required fields
    await page.waitForTimeout(30000)
    //await page.waitForSelector('button:has-text("Synced"):right-of(:text("Wallet 1651231316"))');
   // await page.waitForSelector('svg:has-text("3AAC59"):near(:text("Wallet"))');
    await new SendFunds(page).send(receive_wallet, '0.01', '0.00005' )
 
    //Syncing is an issue for this!!
    //Then I receive a success message
    await expect(page.locator('div[role="dialog"]')).toHaveText("SuccessTransaction has successfully been sent to a full node and included in the mempool.OK" );
    await page.locator('div[role="dialog"] >> text=OK').click();

    // Given I navigate out to all wallets
    await page.locator('[data-testid="LayoutDashboard-log-out"]').click();

    // When I navigate to a receive wallet 
    await page.locator('text=854449615').click();

    // And I navigate to Summary page 
    await page.locator('[data-testid="WalletHeader-tab-summary"]').click();

    // Then Transactions section display the correct wallet, amount and fee
    await expect(page.locator(`text=${receive_wallet} >> nth=0`)).toBeVisible();

    // Given I send funds back 
    await page.locator('[data-testid="WalletHeader-tab-send"]').click();
    await page.waitForTimeout(40000)
    await new SendFunds(page).send(send_wallet, '0.01', '0.00005' )
 
  });

