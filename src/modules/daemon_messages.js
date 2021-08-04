export const daemonMessage = () => ({
  type: 'OUTGOING_MESSAGE',
  message: {
    destination: 'daemon',
  },
});

export const registerService = (service) => {
  const action = daemonMessage();
  action.message.command = 'register_service';
  action.message.data = { service };
  return action;
};

export const startService = (service) => {
  const action = daemonMessage();
  action.message.command = 'start_service';
  action.message.data = { service };
  return action;
};

export const startServiceTest = (service_name) => {
  const action = daemonMessage();
  action.message.command = 'start_service';
  action.message.data = { service: service_name, testing: true };
  return action;
};

export const stopService = (service_name) => {
  const action = daemonMessage();
  action.message.command = 'stop_service';
  action.message.data = { service: service_name };
  return action;
};

export const isServiceRunning = (service_name) => {
  const action = daemonMessage();
  action.message.command = 'is_running';
  action.message.data = { service: service_name };
  return action;
};

export const isKeyringLocked = () => {
  const action = daemonMessage();
  action.message.command = 'is_keyring_locked';
  return action;
}

export const keyringStatus = () => {
  const action = daemonMessage();
  action.message.command = 'keyring_status';
  return action;
}

export const setKeyringPassphrase = (new_passphrase) => {
  const action = daemonMessage();
  action.message.command = 'set_keyring_passphrase';
  action.message.data = { new_passphrase: new_passphrase };
  return action;
}

export const changeKeyringPassphrase = (current_passphrase, new_passphrase) => {
  const action = daemonMessage();
  action.message.command = 'set_keyring_passphrase';
  action.message.data = { current_passphrase: current_passphrase, new_passphrase: new_passphrase };
  return action;
}

export const removeKeyringPassphrase = (current_passphrase) => {
  const action = daemonMessage();
  action.message.command = 'remove_keyring_passphrase';
  action.message.data = { current_passphrase: current_passphrase };
  return action;
}

export const exitDaemon = () => {
  const action = daemonMessage();
  action.message.command = 'exit';
  return action;
};
