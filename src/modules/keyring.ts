type KeyringState = {
  allow_empty_passphrase: boolean;
  min_passphrase_length: number;
};

const initialState: KeyringState = {
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
            allow_empty_passphrase: allow_empty_passphrase,
            min_passphrase_length: min_passphrase_length,
          };
        }
      }
      return state;
    default:
      return state;
  }
}