type KeyringStatus = {
  isKeyringLocked: boolean;
  canSavePassphrase: boolean;
  userPassphraseIsSet: boolean;
  canSetPassphraseHint: boolean;
  passphraseHint: string;
  passphraseRequirements: { isOptional: boolean; min_length: number };
};

export default KeyringStatus;
