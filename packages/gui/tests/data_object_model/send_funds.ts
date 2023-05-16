import type { Page } from 'playwright';
export class SendFunds {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }
  /*async login(email: string, password: string) {
        await this.page.type('input[type="email"]', email);
        await this.page.type('input[type="password"]', password);
        await this.page.click('button[type="submit"]');
    }*/

  async send(receive_wallet: string, amount: string) {
    //}, fee: string) {
    // Given I enter a valid wallet address in address field
    //await this.page.locator('[data-testid="WalletSend-address"]').fill(receive_wallet);
    await this.page.getByTestId('WalletSend-address').fill(receive_wallet);

    // When I enter a valid Amount
    //await this.page.locator('[data-testid="WalletSend-amount"]').fill(amount);
    await this.page.getByTestId('WalletSend-amount').fill(amount);

    // And I enter a valid Fee
    //await this.page.locator('text=Fee *TXCH >> input[type="text"]').fill(fee);
    //await this.page.getByRole('button', { name: '0 (>5 min) TXCH' }).click();
    //await this.page.getByRole('option', { name: '0.00000275276505264396 TXCH Likely in 60 seconds' }).getByText('0.00000275276505264396 TXCH').click();

    // Then I can click Send button
    //await this.page.locator('[data-testid="WalletSend-send"]').click();
    await this.page.getByTestId('WalletSend-send').click();
  }

  async check_balance() {
    if (this.page.locator('text=Spendable Balance0 TXCH >> h5')) {
      console.log('No Funds available!');
      // And I navigate to a wallet with funds
      await this.page.locator('[data-testid="LayoutDashboard-log-out"]').click();
      await this.page.locator('text=873991444').click();
    }
  }
}
