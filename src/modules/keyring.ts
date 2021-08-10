type KeyringState = {
  is_locked: boolean;
  unlock_bad_passphrase: boolean;
  unlock_in_progress: boolean;
  passphrase_support_enabled: boolean;
  user_passphrase_set: boolean;
  needs_migration: boolean;
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
  allow_empty_passphrase: false,
  min_passphrase_length: 0,
};
  
export default function keyringReducer(
  state = { ...initialState },
  action: any
): KeyringState {
  switch (action.type) {
    case 'INCOMING_MESSAGE':
      const { message } = action;
      const { data } = message;
      const { command } = message;
      if (command === 'keyring_status') {
        if (data.success) {
          console.log("keyring_status");
          console.log(data);
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
      } else if (command === 'is_keyring_locked') {
        let success = data.success;
        if (success) {
          const { is_keyring_locked } = data;
          return {
            ...state,
            is_locked: is_keyring_locked,
          };
        }
      } else if (command === 'unlock_keyring') {
        // Clear the keyring_unlock_in_progress flag
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
          }
          else {
            console.log("Failed to unlock keyring: " + data.error);
          }
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
      }
      return state;
    default:
      return state;
  }
}