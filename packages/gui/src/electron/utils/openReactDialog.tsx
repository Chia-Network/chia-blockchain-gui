import { BrowserWindow, ipcMain, type IpcMainInvokeEvent, nativeTheme } from 'electron';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import * as preferences from '../prefs';

import { addAsset, registerAssetProtocol, removeAsset } from './assets';
import openExternal from './openExternal';

function generateScriptContent(confirmId: string) {
  return `
    function collectFormData() {
      var data = {};
      var hasField = false;
      document.querySelectorAll('[data-form-field]').forEach(function (el) {
        var name = el.getAttribute('data-form-field');
        if (!name) return;
        hasField = true;
        var type = (el.getAttribute('type') || el.tagName).toLowerCase();
        if (type === 'checkbox') {
          if (el.dataset.multi !== undefined) {
            if (!Array.isArray(data[name])) data[name] = [];
            if (el.checked) data[name].push(el.value);
          } else {
            data[name] = el.checked;
          }
        } else if (type === 'radio') {
          if (el.checked) data[name] = el.value;
        } else if (type === 'number') {
          // Keep number-input values as strings so that callers parsing high-
          // precision values (e.g. mojo amounts via BigNumber) don't lose
          // precision through Number coercion.
          data[name] = el.value === '' ? null : el.value;
        } else {
          data[name] = el.value;
        }
      });
      return hasField ? data : true;
    }

    function updateDynamicSummary() {
      document.querySelectorAll('[data-summary-counter]').forEach(function (el) {
        var name = el.getAttribute('data-summary-counter');
        if (!name) return;
        var fields = document.querySelectorAll('[data-form-field="' + name + '"]');
        var checked = 0;
        fields.forEach(function (f) { if (f.checked) checked += 1; });
        var template = el.getAttribute('data-summary-template') || '{checked} of {total}';
        el.textContent = template.replace('{checked}', checked).replace('{total}', fields.length);
      });
      document.querySelectorAll('[data-chip-for]').forEach(function (chip) {
        var name = chip.getAttribute('data-chip-for');
        var value = chip.getAttribute('data-chip-value');
        if (!name || value === null) return;
        var input = document.querySelector('[data-form-field="' + name + '"][value="' + value + '"]');
        chip.style.display = input && input.checked ? '' : 'none';
      });
      document.querySelectorAll('[data-empty-placeholder]').forEach(function (el) {
        var name = el.getAttribute('data-empty-placeholder');
        if (!name) return;
        var any = document.querySelectorAll('[data-form-field="' + name + '"]:checked').length > 0;
        el.style.display = any ? 'none' : '';
      });
    }

    // Bidirectional cascade between a "group" checkbox (data-cap-toggle) and
    // its members (data-cap-group). Group state mirrors the AND of members:
    // checked when all are checked, indeterminate when partial, unchecked
    // when none. Group is UI-only and is never collected into form data.
    function refreshCapToggle(group) {
      var toggle = document.querySelector('[data-cap-toggle="' + group + '"]');
      if (!toggle) return;
      var members = document.querySelectorAll('[data-cap-group="' + group + '"]');
      if (members.length === 0) {
        toggle.checked = false;
        toggle.indeterminate = false;
        return;
      }
      var checkedCount = 0;
      members.forEach(function (m) { if (m.checked) checkedCount += 1; });
      if (checkedCount === 0) {
        toggle.checked = false;
        toggle.indeterminate = false;
      } else if (checkedCount === members.length) {
        toggle.checked = true;
        toggle.indeterminate = false;
      } else {
        toggle.checked = false;
        toggle.indeterminate = true;
      }
    }

    document.querySelectorAll('[data-cap-toggle]').forEach(function (toggle) {
      var group = toggle.getAttribute('data-cap-toggle');
      toggle.addEventListener('change', function () {
        var members = document.querySelectorAll('[data-cap-group="' + group + '"]');
        members.forEach(function (m) { m.checked = toggle.checked; });
        toggle.indeterminate = false;
      });
    });

    document.querySelectorAll('[data-cap-group]').forEach(function (member) {
      var group = member.getAttribute('data-cap-group');
      member.addEventListener('change', function () { refreshCapToggle(group); });
    });

    document.querySelectorAll('[data-form-field]').forEach(function (el) {
      el.addEventListener('change', updateDynamicSummary);
    });

    // Disable an input when a named controller checkbox is unchecked.
    // Form scraper ignores disabled, so the value persists across toggles.
    document.querySelectorAll('[data-disabled-when-off]').forEach(function (input) {
      var controllerName = input.getAttribute('data-disabled-when-off');
      var controller = document.querySelector('[data-form-field="' + controllerName + '"]');
      if (!controller) return;
      function syncDisabled() { input.disabled = !controller.checked; }
      controller.addEventListener('change', syncDisabled);
      syncDisabled();
    });

    // Seed member checkboxes from group toggles that were default-checked,
    // then reconcile indeterminate states.
    document.querySelectorAll('[data-cap-toggle]').forEach(function (toggle) {
      if (!toggle.checked) return;
      var group = toggle.getAttribute('data-cap-toggle');
      document.querySelectorAll('[data-cap-group="' + group + '"]').forEach(function (m) {
        m.checked = true;
      });
    });
    var seenGroups = new Set();
    document.querySelectorAll('[data-cap-group]').forEach(function (member) {
      var group = member.getAttribute('data-cap-group');
      if (!seenGroups.has(group)) { seenGroups.add(group); refreshCapToggle(group); }
    });

    updateDynamicSummary();

    document.getElementById('${confirmId}')?.addEventListener('click', function () {
      window.dialogAPI.resolve(collectFormData());
    });

    document.querySelectorAll('[data-action="cancel"]').forEach(function (button) {
      button.addEventListener('click', function () {
        window.dialogAPI.resolve(false);
      });
    });
  `;
}

const dialogData = new Map<number, { resolveChannelId: string; rejectChannelId: string }>();

ipcMain.handle('dialog:init', (event) => {
  const meta = dialogData.get(event.sender.id);
  if (!meta) {
    throw new Error('Dialog data not found');
  }

  dialogData.delete(event.sender.id);

  return meta;
});

export type DialogOptions = {
  title?: string;
  width?: number;
  height?: number;
  hideMenu?: boolean;
  modal?: boolean;
  hideOnBlur?: boolean;
  titleBarStyle?: 'default' | 'hiddenInset' | 'hidden';
};

export default function openReactDialog<TResponse, TProps extends object>(
  parent: BrowserWindow,
  Component: React.ComponentType<TProps>,
  props: Omit<TProps, 'confirmId'>,
  options: DialogOptions,
): Promise<TResponse | undefined> {
  const { title, width, height, hideMenu = false, modal = false, hideOnBlur = false, titleBarStyle } = options;

  const prefs = preferences.readPrefs();

  const resolveChannelId = crypto.randomUUID();
  const rejectChannelId = crypto.randomUUID();
  const confirmId = crypto.randomUUID();

  const isDarkMode = prefs.darkMode ?? nativeTheme.shouldUseDarkColors;
  const initialBgColor = isDarkMode ? '#0f252a' : '#ffffff';

  try {
    const scriptAssetURL = addAsset({
      content: generateScriptContent(confirmId),
      type: 'text/javascript',
    });

    const cssPath = path.join(__dirname, 'main.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    const styleAssetURL = addAsset({
      content: cssContent,
      type: 'text/css',
    });

    const html = renderToStaticMarkup(
      <html lang="en" className={isDarkMode ? 'dark' : ''}>
        <head>
          <meta charSet="utf-8" />
          <meta
            httpEquiv="Content-Security-Policy"
            content="
              default-src 'none';
              base-uri   'none';
              connect-src 'none';
              font-src   'none';
              frame-src  'none';
              img-src    https: data:;
              media-src  'none';
              object-src 'none';
              script-src asset:;
              style-src  asset:;
              worker-src 'none';
              form-action 'none';
            "
          />
          <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes" />
          <link href={styleAssetURL} type="text/css" rel="stylesheet" />
        </head>
        <body>
          <Component {...props} confirmId={confirmId} styleURL={styleAssetURL} isDarkMode={isDarkMode} />
          <script src={scriptAssetURL} />
        </body>
      </html>,
    );

    const dialogURL = addAsset({
      content: `<!DOCTYPE html>${html}`,
      type: 'text/html',
    });

    const assets = [dialogURL, scriptAssetURL, styleAssetURL];

    let settled = false;

    return new Promise<TResponse | undefined>((resolve, reject) => {
      function safeResolve(value: TResponse | undefined) {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      }
      function safeReject(error: Error) {
        if (settled) {
          return;
        }
        settled = true;
        reject(error);
      }

      const dialog = new BrowserWindow({
        modal,
        parent,
        width,
        height,
        title,
        show: false,
        resizable: false,
        useContentSize: true,
        titleBarStyle,
        backgroundColor: initialBgColor,
        webPreferences: {
          partition: `dialog-${crypto.randomUUID()}`,
          preload: path.join(__dirname, 'preloadDialog.js'),
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          nodeIntegrationInSubFrames: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          experimentalFeatures: false,
          plugins: false,
          spellcheck: false,
          webviewTag: false,
        },
      });

      registerAssetProtocol(dialog.webContents.session.protocol);

      const winId = dialog.webContents.id;

      dialogData.set(winId, { resolveChannelId, rejectChannelId });

      dialog.webContents.on('will-navigate', (event, url) => {
        event.preventDefault();
        const currentURL = dialog.webContents.getURL();

        if (url !== currentURL) {
          event.preventDefault();
          openExternal(url);
        }
      });

      // open dev tools
      // dialog.webContents.openDevTools();

      dialog.once('ready-to-show', () => dialog.show());

      if (hideMenu) {
        dialog.setMenu(null);
      }

      ipcMain.handleOnce(resolveChannelId, (event, response: TResponse | undefined) => {
        if (event.sender.id !== winId) {
          return;
        }

        safeResolve(response);
        setImmediate(() => dialog.close());
      });

      ipcMain.handleOnce(rejectChannelId, (event: IpcMainInvokeEvent, error: { message?: string }) => {
        if (event.sender.id !== winId) {
          return;
        }

        safeReject(new Error(error?.message ?? 'Unknown error'));
        setImmediate(() => dialog.close());
      });

      dialog.once('closed', () => {
        dialogData.delete(winId);

        ipcMain.removeHandler(resolveChannelId);
        ipcMain.removeHandler(rejectChannelId);

        removeAsset(assets);

        safeResolve(undefined);
      });

      if (hideOnBlur) {
        dialog.on('blur', () => {
          safeResolve(undefined);
          dialog.close();
        });
      }

      dialog.loadURL(dialogURL);
    });
  } catch (error) {
    console.error('Failed to render React component:', error);
    throw new Error('Failed to render dialog content');
  }
}
