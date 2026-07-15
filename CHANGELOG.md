# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project does not yet adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for setuptools_scm/PEP 440 reasons.

## 2.7.3 Chia blockchain 2026-07-15

## What's Changed

### Changed

- Allow `chia_getHeightInfo` and `chia_getCoinRecordsByNames` WalletConnect commands to bypass confirmation prompts for read-only queries

### Fixed

- Fix confirmation dialogs not appearing on Linux (especially Wayland) when the `ready-to-show` event never fires
- Fix Plot NFTs appearing assigned to the wrong key due to `launcherId` hex normalization
- Fix log viewing in the reference wallet GUI by restoring missing Electron main-process imports
- Fix "Asset type is not valid" error when confirming offers to sell NFTs
- Fix WalletConnect JSON parsing for negative mojo amounts encoded as BigInt strings
