# chia-blockchain-gui

![Chia logo](https://www.chia.net/wp-content/uploads/2022/09/chia-logo.svg)

![GitHub contributors](https://img.shields.io/github/contributors/Chia-Network/chia-blockchain-gui?logo=GitHub)

Welcome to the Chia GUI repo!

Chia GUI is written in TypeScript and uses Electron/React.

This monorepo consists of the following packages:

| Package name  | Description                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| **api**       | JS/TS library to access the Chia Blockchain RPC                                                            |
| **api-react** | React library that wraps **api** in hooks                                                                  |
| **core**      | Common React components and hooks                                                                          |
| **gui**       | The actual GUI package. It uses our packages like **api-react** and **core** under the hood                |
| **icons**     | Chia specific icons                                                                                        |
| **wallets**   | Common React components and hooks. Do not use this in you project. Will be merged to **core** package soon |

## Development

1. This repo (chia-blockchain-gui) must be under chia-blockchain repo. Please follow the [installation steps for the chia-blockchain](https://github.com/Chia-Network/chia-blockchain/wiki/INSTALL#install-from-source). Make sure to install from source code (git clone...).
2. Run the `sh install-gui.sh` as instructed in the previous step. This will clone the chia-blockchain-gui under chia-blockchain repo.
3. Run `npm run dev:gui`

**When developing, please:**

- Only edit the code with the **Vscode editor**.
- Always have **chia-blockchain-gui opened as a root folder in the Vscode** and not chia-blockchain, or chia-blockchain-gui/packages/... Failing to do so will result in incorrect auto linting and auto formatting which would not go through the CI quality checks.
- When you open the repo in the vscode, click on "**Install recommended plugins**" pop-up.
- To develop in testnet, please follow [these steps](https://github.com/Chia-Network/chia-blockchain/wiki/How-to-connect-to-the-Testnet).
- Please write tests for your code
- When disabling an eslint rule, please provide a reason after two dashes (--), example:

  `// eslint-disable-next-line react-hooks/exhaustive-deps -- Some dependencies intentionally left out`

## Installing NPM packages

To install an NPM package, please navigate to the **root directory** of this repo.

- To install `lodash` for **all** packages: `npx lerna add lodash`
- To install `lodash` for **single** package: `npx lerna add lodash --scope=@chia-network/icons`
- To install as a dev dependency, add `--dev`

After adding a new NPM package, please **pin down the package version**. This is done to lower the possibility of supply chain attacks.

## Common eslint issues

- **react/no-array-index-key**

  Only use `index` as a `key` when all of the following conditions are met:

  1.  the list and items are static / hardcoded.
  2.  the list is never reordered or filtered.

  In all other cases, you have to figure out what unique string you will use as a `key`, or create a dedicated `ID`.

- **import/no-extraneous-dependencies**

  Packages that are used only in development should not be present on the production build. You have 3 options:

  1. If it's a whole directory, add it to the `.eslintrc.json` file
  2. If it's a single file, rename it by adding `.dev.` in the extension. Example: `file.ts` -> `file.dev.ts`
  3. If it's a file that is run on the production, use this:

  ```
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line global-require -- We cannot use import since it should be only loaded in development
    const package = require('package');
  }
  ```

## Git workflow

- Git branch from "**main**"
- For Chia employees: **prefix your branch with your name**, like this: `yourName/what-is-the-code-about`. This helps when cleaning up old branches.
- All commits must be [signed](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).

## Git commit messages

1. Separate subject from body with a blank line

   A single subject line is usually sufficient, but if you need to include additional details, add an empty line after the subject and enter the detailed message. Example:

   > Capitalized, short (70 chars or less) summary
   >
   > More detailed explanatory text, if necessary. Wrap it to about 72
   > characters or so. In some contexts, the first line is treated as the
   > subject of an email and the rest of the text as the body. The blank
   > line separating the summary from the body is critical (unless you omit
   > the body entirely); tools like rebase can get confused if you run the
   > two together.

2. Commit subject line should always be able to complete the following sentence:

   **If applied, this commit will** `your subject line here`

   ~~Fixed bug with Y~~ -> Fix bug in the contact form

   ~~Adding new field of X~~ -> Add new field - "discount code", in the order form

   ~~More fixes for broken stuff~~ -> Fix broken responsive layout

## Localization

Do not edit files directly in the repo, but instead please head over to our [Crowdin project](https://chia.crowdin.com/chia-blockchain-gui) and add/edit translations there.

## Troubleshooting

- **`npm install` in the root directory does not install packages correctly (Or other Lerna issues)**

  Please run `npx lerna clean -y && rm -rf node_modules && npm install && npx lerna bootstrap`

- **`npm run dev:gui` fails to start the app without providing a reason**

  1. In your command line, please go to the `chia-blockchain` directory (one level up)
  2. Run `. ./activate`
  3. Run `cd chia-blockchain-gui`
  4. Run `npm run dev:gui` to start the app.
  5. If still does not work, please open you process manager and kill all Chia / Python related processes.

- **Why does my component keep rerendering?**

  We have [why-did-you-render](https://github.com/welldone-software/why-did-you-render) installed.

  You will see the reasons in the electron console after adding this to your functional component:

  ```
  YourComponent.whyDidYouRender = {
    logOnDifferentValues: true,
  }
  ```

## Debugging

1. In the Chia Electron app, click `View -> Developer -> Developer tools`.
2. In the console tab of the developer tools, change the default console events to include `verbose` events. These are the events emitted from the `debug` package.

## Simulator / SimNet

1. Please follow the [Install and configure the simulator](https://docs.chia.net/guides/simulator-user-guide/). Do this step only once.
2. In the chia-blockchain directory, run this to setup the ENV variables. Use these instead of the ones mentioned in the above guide.

```
export CHIA_ROOT=~/.chia/simulator/main
export CHIA_SIMULATOR_ROOT=~/.chia/simulator
export CHIA_KEYS_ROOT=~/.chia_keys_simulator
```

3. `. ./activate`
4. `chia start simulator`
5. `cd chia-blockchain-gui/packages/gui`
6. `npm run dev:skipLocales`
7. You should see your simulator wallets. You should not see your testNet / mainNet wallets.
8. Run `chia dev sim farm` as many times you want to farm some coins.

## Chia FAQ/WIKI

Please check out the [wiki](https://github.com/Chia-Network/chia-blockchain/wiki)
and [FAQ](https://github.com/Chia-Network/chia-blockchain/wiki/FAQ) for
information on this project.
