// pages/closeDialog.ts

import type { Page } from 'playwright';

export class CloseDialog {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async closeIt() {
    await this.page.locator('button:has-text("Close")').click();
  }

  async logOut() {
    await this.page.locator('[data-testid="LayoutDashboard-log-out"]').click();
  }
}
