const eph = require('electron-playwright-helpers');
const { test, expect } = require("@playwright/test");
const {Page, _electron: electron } = require('playwright');

  test('launch app', async () => {
    const electronApp = await electron.launch({ args: ['../packages/gui/build/electron'] })
    // close app
    await electronApp.close()
  })