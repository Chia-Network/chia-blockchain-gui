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

Feel free to install any of these packages as dependencies for your next Chia project.

## Development

1. This repo (chia-blockchain-gui) must be under chia-blockchain repo. Please follow the [installation steps for the chia-blockchain](https://github.com/Chia-Network/chia-blockchain/wiki/INSTALL#install-from-source). Make sure to install from source code (git clone...).
2. Run the `sh install-gui.sh` as instructed in the previous step. This will clone the chia-blockchain-gui under chia-blockchain repo.
3. Run `npm run dev:gui`

When developing, please:

- Only edit the code via the **Vscode editor**.
- Always have **chia-blockchain-gui opened as a root folder in the Vscode** and not chia-blockchain, or chia-blockchain-gui/packages/... Failing to do so will result in incorrect auto linting and auto formatting which would not go trough the CI quality checks.
- When you open the repo in the vscode, click on "Install recommended plugins" pop-up.
- To develop in testnet, please follow [these steps](https://github.com/Chia-Network/chia-blockchain/wiki/How-to-connect-to-the-Testnet).
- Git branch from "main"
- Please write tests for your code
- When disabling an eslint rule, please provide a reason after two dashes (--), example:

  `// eslint-disable-next-line react-hooks/exhaustive-deps -- Some dependencies intentionally left out`

## Localization

Do not edit files directly in the repo, but instead please head over to our [Crowdin project](https://crowdin.com/project/chia-blockchain/) and add/edit translations there.

## FAQ/WIKI

Please check out the [wiki](https://github.com/Chia-Network/chia-blockchain/wiki)
and [FAQ](https://github.com/Chia-Network/chia-blockchain/wiki/FAQ) for
information on this project.
