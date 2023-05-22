//pages/readData.ts

let dataFile = require('../data_fixtures/data.json');
let dataFile12 = require('../data_fixtures/data12.json');

import type { Page } from 'playwright';
export class ReadData {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async get24Words() {
    let i = 0;

    while (i < 24) {
      let x = JSON.stringify(i);
      let dataVariable = dataFile[x];
      // Given I enter the first 24 words of the mnemonic
      await this.page.locator(`[data-testid="mnemonic-${i}"] input[role="combobox"]`).fill(dataVariable);
      //await this.page.waitForTimeout(1000);

      i++;
    }
  }

  async get12Words() {
    let i = 0;

    while (i < 12) {
      let x = JSON.stringify(i);
      //let dataVariable = JSON.stringify(dataFile12[x]);
      let dataVariable = dataFile12[x];
      // Given I enter the first 12 words of the mnemonic
      await this.page.locator(`[data-testid="mnemonic-${i}"] input[role="combobox"]`).fill(dataVariable);
      i++;
    }
  }

  async pasteWords() {
    //await this.page.locator('#mui-52').fill(' "abandon" "ability" "able" "about" "above" "absent" "baby" "bachelor" "bacon" "badge" "bag" "balance" "cabbage" "cabin" "cable" "cactus" "cage" "cake" "dad" "damage" "damp" "dance" "danger" "daring"');
    await this.page
      .locator('#mui-52')
      .fill(
        'abandon ability able about above absent baby bachelor bacon badge bag balance cabbage cabin cable cactus cage cake dad damage damp dance danger daring'
      );
  }
}
