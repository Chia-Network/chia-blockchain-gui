import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import { CloseDialog } from '../data_object_model/close_dialog';
import date from 'date-and-time';
const now = new Date();

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['./build/electron/main.js'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await page.close();
});

test('Verify that an Offer can created via the NFT page', async () => {
  //Pre-requisites to get user back to Wallet selection page
  await new CloseDialog(page).closeIt();

  // Given I navigate to an NFT page within wallet
  await page.getByRole('button', { name: 'Jahi 1st Wallet' }).click();

  //When I create an offer for an NFT
  await page.getByTestId('DashboardSideBar-nfts').click();
  await page.getByRole('button', { name: 'ChiREX #996' }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Create Offer' }).click();

  //await page.pause();
  //Then I should be able to save the offer
  await page.getByRole('heading', { name: 'Requesting' }).click();
  await page.getByRole('button', { name: 'Create Offer' }).click();
  await page.getByRole('button', { name: 'I Understand, Create Offer' }).click();
  await page.getByRole('button', { name: 'Close' }).click();

  //And I should be able to cancel the offer
  await page.getByTestId('DashboardSideBar-offers').click();
  await expect(
    page
      .getByRole('row', { name: `Pending Accept ChiREX #996 ${date.format(now, 'MMMM D, YYYY h:mm A')}` })
      .getByRole('button', { name: 'more' })
  ).toBeVisible();
  await page
    .getByRole('row', { name: `Pending Accept ChiREX #996 ${date.format(now, 'MMMM D, YYYY h:mm A')}` })
    .getByRole('button', { name: 'more' })
    .click();
  await page.getByText('Cancel Offer').click();
  await page.getByRole('button', { name: 'Cancel Offer' }).click();
});
