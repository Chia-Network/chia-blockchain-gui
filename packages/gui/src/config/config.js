const env = typeof process !== 'undefined' ? process.env : {};

export default {
  multipleWallets: env?.MULTIPLE_WALLETS === 'true',
  local_test: env?.LOCAL_TEST === 'true',
};
