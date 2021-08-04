import {
  service_wallet,
  service_full_node,
  service_simulator,
  service_daemon,
  service_farmer,
  service_harvester,
  service_plotter,
} from '../util/service_names';

type DeamonState = {
  daemon_running: boolean;
  daemon_connected: boolean;
  wallet_running: boolean;
  wallet_connected: boolean;
  full_node_running: boolean;
  full_node_connected: boolean;
  farmer_running: boolean;
  farmer_connected: boolean;
  harvester_running: boolean;
  harvester_connected: boolean;
  plotter_running: boolean;
  exiting: boolean;
  keyring_locked: boolean;
  keyring_unlock_bad_passphrase: boolean;
  keyring_unlock_in_progress: boolean;
  keyring_passphrase_support_enabled: boolean;
  keyring_user_passphrase_set: boolean;
  keyring_needs_migration: boolean;
};

const initialState: DeamonState = {
  daemon_running: false,
  daemon_connected: false,
  wallet_running: false,
  wallet_connected: false,
  full_node_running: false,
  full_node_connected: false,
  farmer_running: false,
  farmer_connected: false,
  harvester_running: false,
  harvester_connected: false,
  plotter_running: false,
  exiting: false,
  keyring_locked: false,
  keyring_unlock_bad_passphrase: false,
  keyring_unlock_in_progress: false,
  keyring_passphrase_support_enabled: false,
  keyring_user_passphrase_set: false,
  keyring_needs_migration: false,
};

export default function daemonReducer(
  state = { ...initialState },
  action: any,
): DeamonState {
  switch (action.type) {
    case 'INCOMING_MESSAGE':
      if (
        action.message.origin !== service_daemon &&
        action.message.command !== 'ping'
      ) {
        return state;
      }
      const { message } = action;
      const { data } = message;
      const { command } = message;
      if (command === 'register_service') {
        return { ...state, daemon_running: true, daemon_connected: true };
      }
      if (command === 'start_service') {
        const { service } = data;
        if (service === service_full_node) {
          return { ...state, full_node_running: true };
        }
        if (service === service_simulator) {
          return { ...state, full_node_running: true };
        }
        if (service === service_wallet) {
          return { ...state, wallet_running: true };
        }
        if (service === service_farmer) {
          return { ...state, farmer_running: true };
        }
        if (service === service_harvester) {
          return { ...state, harvester_running: true };
        }
      } else if (command === 'ping') {
        const { origin } = message;
        if (origin === service_full_node) {
          return { ...state, full_node_connected: true };
        }
        if (origin === service_simulator) {
          return { ...state, full_node_connected: true };
        }
        if (origin === service_wallet) {
          return { ...state, wallet_connected: true };
        }
        if (origin === service_farmer) {
          return { ...state, farmer_connected: true };
        }
        if (origin === service_harvester) {
          return { ...state, harvester_connected: true };
        }
      } else if (command === 'is_running') {
        if (data.success) {
          const { service } = data;
          if (service === service_plotter) {
            return { ...state, plotter_running: data.is_running };
          }
          if (service === service_full_node) {
            return { ...state, full_node_running: data.is_running };
          }
          if (service === service_wallet) {
            return { ...state, wallet_running: data.is_running };
          }
          if (service === service_farmer) {
            return { ...state, farmer_running: data.is_running };
          }
          if (service === service_harvester) {
            return { ...state, harvester_running: data.is_running };
          }
        }
      } else if (command === 'stop_service') {
        if (data.success) {
          if (data.service_name === service_plotter) {
            return { ...state, plotter_running: false };
          }
        }
      } else if (command === 'is_keyring_locked') {
        let success = data.success;
        if (success) {
          const { is_keyring_locked } = data;
          return {
            ...state,
            keyring_locked: is_keyring_locked,
          };
        }
      } else if (command === 'keyring_status') {
        let success = data.success;
        console.log("INCOMING SUCCESS")
        console.log(success)
        if (success) {
          console.log("INCOMING DATA")
          console.log(data)
          const { is_keyring_locked } = data;
          const { passphrase_support_enabled } = data;
          const { user_passphrase_is_set } = data;
          const { needs_migration } = data;
          return {
            ...state,
            keyring_locked: is_keyring_locked,
            keyring_passphrase_support_enabled: passphrase_support_enabled,
            keyring_user_passphrase_set: user_passphrase_is_set,
            keyring_needs_migration: needs_migration,
          };
        }
      } else if (command === 'unlock_keyring') {
        // Clear the keyring_unlock_in_progress flag
        state = { ...state, keyring_unlock_in_progress: false };
        if (data.success) {
          console.log("Keyring was successfully unlocked");
          return {
            ...state,
            keyring_locked: false,
            keyring_unlock_bad_passphrase: false,
          };
        }
        else {
          if (data.error === 'bad passphrase') {
            console.log("Keyring passphrase is invalid");
            return {
              ...state,
              keyring_unlock_bad_passphrase: true,
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
        action.message.command === 'exit' &&
        action.message.destination === 'daemon'
      ) {
        return { ...state, exiting: true };
      }
      else if (
        action.message.command === 'unlock_keyring' &&
        action.message.destination === 'daemon'
      ) {
        // Set a flag indicating that we're attempting to unlock the keyring
        return { ...state, keyring_unlock_in_progress: true };
      }
      return state;
    case 'WS_DISCONNECTED':
      return initialState;
    default:
      return state;
  }
}
