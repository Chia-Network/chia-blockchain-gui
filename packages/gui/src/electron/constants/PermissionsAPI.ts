import API from './API';

enum PermissionsAPI {
  FIND_PAIR = `${API.PERMISSIONS}:findPair`,
  GET_PAIRS = `${API.PERMISSIONS}:getPairs`,
  REGISTER_PAIR = `${API.PERMISSIONS}:registerPair`,
  EDIT_PAIR = `${API.PERMISSIONS}:editPair`,
  REVOKE_PAIR = `${API.PERMISSIONS}:revokePair`,
  RESET_PAIR_BYPASS = `${API.PERMISSIONS}:resetPairBypass`,
  RESET_ALL_PAIR_BYPASSES = `${API.PERMISSIONS}:resetAllPairBypasses`,
  DISPATCH_AS_PAIR = `${API.PERMISSIONS}:dispatchAsPair`,
  GET_COMMAND_METADATA = `${API.PERMISSIONS}:getCommandMetadata`,
  SUBSCRIBE_FOR_NOTIFICATIONS = `${API.PERMISSIONS}:subscribeForNotifications`,
}

export default PermissionsAPI;
