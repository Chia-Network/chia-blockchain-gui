export default {
  // FIXME: Temporarily hardcoded to true
  // multipleWallets: process.env.MULTIPLE_WALLETS === 'true',
  multipleWallets: true,
  local_test: process.env.LOCAL_TEST === 'true',
  backup_host: 'https://backup.chia.net',
};
