export type KeyringState = {
  is_locked: boolean;
  unlock_bad_passphrase: boolean;
  unlock_in_progress: boolean;
  passphrase_support_enabled: boolean;
  user_passphrase_set: boolean;
  needs_migration: boolean;
  migration_in_progress: boolean;
  migration_skipped: boolean;
  allow_empty_passphrase: boolean;
  min_passphrase_length: number;
};

const initialState: KeyringState = {
  is_locked: false,
  unlock_bad_passphrase: false,
  unlock_in_progress: false,
  passphrase_support_enabled: false,
  user_passphrase_set: false,
  needs_migration: false,
  migration_in_progress: false,
  migration_skipped: false,
  allow_empty_passphrase: false,
  min_passphrase_length: 0,
};

export default function keyringReducer(
  state = { ...initialState },
  action: any
): KeyringState {
  switch (action.type) {
    case 'SKIP_KEYRING_MIGRATION':
      return {
        ...state,
        migration_skipped: action.skip,
      };
    case 'INCOMING_MESSAGE':
      const { message } = action;
      const { data } = message;
      const { command } = message;
      if ((command === 'keyring_status') || (command === 'keyring_status_changed')) {
        if (data.success) {
          const { is_keyring_locked } = data;
          const { passphrase_support_enabled } = data;
          const { user_passphrase_is_set } = data;
          const { needs_migration } = data;
          const { passphrase_requirements } = data;
          const allow_empty_passphrase = passphrase_requirements.is_optional || false;
          const min_passphrase_length = passphrase_requirements.min_length || 10;
          return {
            ...state,
            is_locked: is_keyring_locked,
            passphrase_support_enabled: passphrase_support_enabled,
            user_passphrase_set: user_passphrase_is_set,
            needs_migration: needs_migration,
            allow_empty_passphrase: allow_empty_passphrase,
            min_passphrase_length: min_passphrase_length,
          };
        }
      } else if (command === 'unlock_keyring') {
        // Clear the unlock_in_progress flag
        state = {
          ...state,
          unlock_in_progress: false
        };
        if (data.success) {
          return {
            ...state,
            is_locked: false,
            unlock_bad_passphrase: false,
          };
        }
        else {
          if (data.error === 'bad passphrase') {
            return {
              ...state,
              unlock_bad_passphrase: true,
            };
          } else {
            console.log("Failed to unlock keyring: " + data.error);
          }
        }
      } else if (command === 'migrate_keyring') {
        // Clear the migration_in_progress flag
        state = {
          ...state,
          migration_in_progress: false
        };
        if (data.success) {
          return {
            ...state,
            needs_migration: false,
          };
        } else {
          console.log("Failed to migrate keyring: " + data.error);
        }
      }
      return state;
    case 'OUTGOING_MESSAGE':
      if (
        action.message.command === 'unlock_keyring' &&
        action.message.destination === 'daemon'
      ) {
        // Set a flag indicating that we're attempting to unlock the keyring
        return {
          ...state,
          unlock_in_progress: true
        };
      } else if (
        action.message.command === 'migrate_keyring' &&
        action.message.destination === 'daemon'
      ) {
        // Set a flag indicating that we're attempting to migrate the keyring
        return {
          ...state,
          migration_in_progress: true
        };
      }
      return state;
    default:
      return state;
  }
}