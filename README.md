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
- Always have **chia-blockchain-gui opened as a root folder in the Vscode** and not chia-blockchain, or chia-blockchain-gui/packages/... Failing to do so will result in incorrect auto linting and auto formatting which would not go trough the CI quality checks.
- When you open the repo in the vscode, click on "**Install recommended plugins**" pop-up.
- To develop in testnet, please follow [these steps](https://github.com/Chia-Network/chia-blockchain/wiki/How-to-connect-to-the-Testnet).
- Please write tests for your code
- When adding a new NPM package, please **pin down the package version**. This is done to lower the possibility of supply chain attacks.
- When disabling an eslint rule, please provide a reason after two dashes (--), example:

  `// eslint-disable-next-line react-hooks/exhaustive-deps -- Some dependencies intentionally left out`

## Git workflow

- Git branch from "**main**"
- For Chia employees: **prefix your branch with your name**, like this: `yourName/what-is-the-code-about`. This helps when cleaning up old branches.
- All commits must be [signed](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).

## Git commit messages

1. Separate subject from body with a blank line

   Most often, you do not need commit body message at all. But if you need one, separate it with a new line. Example:

   ```
    Capitalized, short (70 chars or less) summary

    More detailed explanatory text, if necessary. Wrap it to about 72
    characters or so. In some contexts, the first line is treated as the
    subject of an email and the rest of the text as the body. The blank
    line separating the summary from the body is critical (unless you omit
    the body entirely); tools like rebase can get confused if you run the
    two together.
   ```

2. Commit subject line should always be able to complete the following sentence:

   **If applied, this commit will** `your subject line here`

   ~~Fixed bug with Y~~ -> Fix bug in the contact form

   ~~Adding new field of X~~ -> Add new field - "discount code", in the order form

   ~~More fixes for broken stuff~~ -> Fix broken responsive layout

## Localization

Do not edit files directly in the repo, but instead please head over to our [Crowdin project](https://crowdin.com/project/chia-blockchain/) and add/edit translations there.

## Troubleshooting

- **`npm install` in the root directory does not install packages correctly (Or other Lerna issues)**

  Please run `npx lerna clean -y && rm -rf node_modules && npm install && npx lerna bootstrap`

## Chia FAQ/WIKI

Please check out the [wiki](https://github.com/Chia-Network/chia-blockchain/wiki)
and [FAQ](https://github.com/Chia-Network/chia-blockchain/wiki/FAQ) for
information on this project.
