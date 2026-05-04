enum PermissionsAPI {
  PAIR_LIST = 'permissions:pair:list',
  PAIR_REGISTER = 'permissions:pair:register',
  PAIR_EDIT = 'permissions:pair:edit',
  PAIR_REVOKE = 'permissions:pair:revoke',
  PAIR_RESET_BYPASS = 'permissions:pair:resetBypass',
  PAIR_RESET_BYPASS_ALL = 'permissions:pair:resetBypassAll',
  PAIR_RESET_SPENT = 'permissions:pair:resetSpent',
  DISPATCH_AS_PAIR = 'permissions:dispatchAsPair',
  COMMANDS_METADATA = 'permissions:commands:metadata',
  NOTIFICATION_EVENT = 'permissions:notification',
}

export default PermissionsAPI;
