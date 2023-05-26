import { randomBytes } from 'crypto';

import BigNumber from 'bignumber.js';

import Message from '../Message';
import { ServiceNameValue } from '../constants/ServiceName';
import Wallet from './WalletService';

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('WalletService', () => {
  let service: Wallet;
  let client: any;

  beforeEach(() => {
    (randomBytes as any).mockReset();
    (randomBytes as any).mockReturnValue(Buffer.from('test'));

    client = {
      origin: 'test_origin',
      addService: jest.fn(),
      on: jest.fn(),
      send: jest.fn(),
    };
    service = new Wallet(client, {});
  });

  it('sends command to client', async () => {
    const command = 'test_command';
    const data = { test: 'test', testKey1: 'test', testKey2: 'test' };
    const expected = [
      new Message({
        command,
        data,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.command(command, data);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_logged_in_fingerprint', async () => {
    const expected = [
      new Message({
        command: 'get_logged_in_fingerprint',
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getLoggedInFingerprint();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_wallets with includeData=false by default', async () => {
    const expected = [
      new Message({
        command: 'get_wallets',
        data: { includeData: false },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getWallets();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_wallets with includeData=true when specified', async () => {
    const expected = [
      new Message({
        command: 'get_wallets',
        data: { includeData: true },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getWallets({ includeData: true });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_transaction with transactionId', async () => {
    const transactionId = 'test_transaction_id';
    const expected = [
      new Message({
        command: 'get_transaction',
        data: { transactionId },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getTransaction({ transactionId });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_transaction_memo with transactionId', async () => {
    const transactionId = 'test_transaction_id';
    const expected = [
      new Message({
        command: 'get_transaction_memo',
        data: { transactionId },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getTransactionMemo({ transactionId });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls getPwStatus', async () => {
    const walletId = 2;
    const expected = [
      new Message({
        command: 'pw_status',
        data: { walletId },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getPwStatus({ walletId });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls pw_absorb_rewards with walletId and fee', async () => {
    const walletId = 2;
    const fee = '0.0001';
    const expected = [
      new Message({
        command: 'pw_absorb_rewards',
        data: { walletId, fee },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.pwAbsorbRewards({ walletId, fee });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls pw_join_pool with walletId, poolUrl, relativeLockHeight, targetPuzzlehash and fee', async () => {
    const walletId = 2;
    const poolUrl = 'test_pool_url';
    const relativeLockHeight = 100;
    const targetPuzzlehash = 'test_target_puzzlehash';
    const fee = '0.0001';
    const expected = [
      new Message({
        command: 'pw_join_pool',
        data: { walletId, poolUrl, relativeLockHeight, targetPuzzlehash, fee },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.pwJoinPool({ walletId, poolUrl, relativeLockHeight, targetPuzzlehash, fee });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls pw_self_pool with walletId and fee', async () => {
    const walletId = 2;
    const fee = '0.0001';
    const expected = [
      new Message({
        command: 'pw_self_pool',
        data: { walletId, fee },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.pwSelfPool({ walletId, fee });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls create_new_wallet with walletType and options', async () => {
    const walletType = 'pool_wallet';
    const options = { name: 'test_wallet' };
    const expected = [
      new Message({
        command: 'create_new_wallet',
        data: { walletType, ...options },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.createNewWallet({ walletType, options });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls deleteUnconfirmedTransactions with walletId', async () => {
    const walletId = 2;
    const expected = [
      new Message({
        command: 'delete_unconfirmed_transactions',
        data: { walletId },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.deleteUnconfirmedTransactions({ walletId });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls getWalletBalance with walletId', async () => {
    const walletId = 2;
    const expected = [
      new Message({
        command: 'get_wallet_balance',
        data: { walletId },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getWalletBalance({ walletId });
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls getFarmedAmount', async () => {
    const expected = [
      new Message({
        command: 'get_farmed_amount',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getFarmedAmount();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls send_transaction with the correct parameters', async () => {
    const args = {
      walletId: 1,
      amount: new BigNumber(100),
      fee: new BigNumber(10),
      address: 'test_address',
      memos: ['test_memo'],
    };
    const expected = [
      new Message({
        command: 'send_transaction',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.sendTransaction(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls generate_mnemonic', async () => {
    const expected = [
      new Message({
        command: 'generate_mnemonic',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.generateMnemonic();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_public_keys', async () => {
    const expected = [
      new Message({
        command: 'get_public_keys',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getPublicKeys();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls add_key with the correct parameters', async () => {
    const args = {
      mnemonic: ['test', 'mnemonic', 'words'],
      type: 'new_wallet',
    };
    const expected = [
      new Message({
        command: 'add_key',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.addKey(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls delete_key with the correct parameters', async () => {
    const args = {
      fingerprint: 123_456_789,
    };
    const expected = [
      new Message({
        command: 'delete_key',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.deleteKey(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls check_delete_key with the correct parameters', async () => {
    const args = {
      fingerprint: 123_456_789,
    };
    const expected = [
      new Message({
        command: 'check_delete_key',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.checkDeleteKey(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls delete_all_keys', async () => {
    const expected = [
      new Message({
        command: 'delete_all_keys',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.deleteAllKeys();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls log_in with the correct parameters', async () => {
    const args = {
      fingerprint: 'test_fingerprint',
      type: 'skip',
    };
    const expected = [
      new Message({
        command: 'log_in',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.logIn(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_private_key with the correct parameters', async () => {
    const args = {
      fingerprint: 123_456_789,
    };
    const expected = [
      new Message({
        command: 'get_private_key',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getPrivateKey(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_transactions with the correct parameters', async () => {
    const args = {
      walletId: 1,
      start: 0,
      end: 10,
      sortKey: 'CONFIRMED_AT_HEIGHT',
      reverse: true,
    };
    const expected = [
      new Message({
        command: 'get_transactions',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getTransactions(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_transaction_count with the correct parameters', async () => {
    const args = {
      walletId: 1,
    };
    const expected = [
      new Message({
        command: 'get_transaction_count',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getTransactionsCount(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_next_address with the correct parameters', async () => {
    const args = {
      walletId: 1,
      newAddress: true,
    };
    const expected = [
      new Message({
        command: 'get_next_address',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getNextAddress(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls farm_block with the correct parameters', async () => {
    const args = {
      address: 'test_address',
    };
    const expected = [
      new Message({
        command: 'farm_block',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.farmBlock(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_timestamp_for_height with the correct parameters', async () => {
    const args = {
      height: 123,
    };
    const expected = [
      new Message({
        command: 'get_timestamp_for_height',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getTimestampForHeight(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_height_info', async () => {
    const expected = [
      new Message({
        command: 'get_height_info',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getHeightInfo();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_network_info', async () => {
    const expected = [
      new Message({
        command: 'get_network_info',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getNetworkInfo();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_sync_status', async () => {
    const expected = [
      new Message({
        command: 'get_sync_status',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getSyncStatus();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_connections', async () => {
    const expected = [
      new Message({
        command: 'get_connections',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getConnections();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_all_offers with the correct parameters', async () => {
    const args = {
      start: 0,
      end: 10,
      sortKey: 'CONFIRMED_AT_HEIGHT',
      reverse: true,
      includeMyOffers: true,
      includeTakenOffers: true,
    };
    const expected = [
      new Message({
        command: 'get_all_offers',
        data: {
          includeCompleted: true,
          fileContents: true,
          start: args.start,
          end: args.end,
          sortKey: args.sortKey,
          reverse: args.reverse,
          excludeMyOffers: !args.includeMyOffers,
          excludeTakenOffers: !args.includeTakenOffers,
        },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getAllOffers(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_offers_count', async () => {
    const expected = [
      new Message({
        command: 'get_offers_count',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getOffersCount();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls create_offer_for_ids with the correct parameters', async () => {
    const args = {
      fee: new BigNumber(1),
      driverDict: {
        '38a0dd823db068c6169e1e7e060e6a386031b9b145510d5a9b4610212383fbe9': {
          also: {
            metadata:
              '((117 "https://bafybeigzcazxeu7epmm4vtkuadrvysv74lbzzbl2evphtae6k57yhgynp4.ipfs.nftstorage.link/9206.png") (104 . 0xe694173770fb8821f7bf8063b6ec2b68cd278baa8292a428c56234b778311c8a) (28021 "https://bafybeigzcazxeu7epmm4vtkuadrvysv74lbzzbl2evphtae6k57yhgynp4.ipfs.nftstorage.link/9206.json") (27765) (29550 . 1) (29556 . 1) (28008 . 0x43f7a4c9f40864e54d6de564a37955c74f6c0c57c1274cda054faaa4bee422da))',
            type: 'metadata',
            updater_hash: '0xfe8a4b4e27a2e29a4d3fc7ce9d527adbcaccbab6ada3903ccf3ba9a769d2d78b',
          },
          launcher_id: '0x38a0dd823db068c6169e1e7e060e6a386031b9b145510d5a9b4610212383fbe9',
          launcher_ph: '0xeff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9',
          type: 'singleton',
        },
      },
      offer: { '38a0dd823db068c6169e1e7e060e6a386031b9b145510d5a9b4610212383fbe9': 1, '42': -1234 },
      validateOnly: true,
      disableJSONFormatting: true,
    };
    const { disableJSONFormatting, driverDict, ...restArgs } = args;
    const expected = [
      new Message({
        command: 'create_offer_for_ids',
        data: { driverDict, ...restArgs },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      disableJSONFormatting,
    ];

    await service.createOfferForIds(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls cancel_offer with the correct parameters', async () => {
    const args = {
      tradeId: 'test_trade_id',
      secure: true,
      fee: '1',
    };
    const expected = [
      new Message({
        command: 'cancel_offer',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.cancelOffer(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls check_offer_validity with the correct parameters', async () => {
    const args = { offer: 'test_offer' };
    const expected = [
      new Message({
        command: 'check_offer_validity',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.checkOfferValidity(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls take_offer with the correct parameters', async () => {
    const args = {
      offer: 'test_offer',
      fee: '1',
    };
    const expected = [
      new Message({
        command: 'take_offer',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.takeOffer(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_offer_summary with the correct parameters', async () => {
    const args = { offerData: 'test_offer_data' };
    const expected = [
      new Message({
        command: 'get_offer_summary',
        data: { offer: args.offerData },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getOfferSummary(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_offer with fileContents=true', async () => {
    const args = { offerId: 'test_offer_id' };
    const expected = [
      new Message({
        command: 'get_offer',
        data: { tradeId: args.offerId, fileContents: true },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getOfferData(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_offer with fileContents=false', async () => {
    const args = { offerId: 'test_offer_id' };
    const expected = [
      new Message({
        command: 'get_offer',
        data: { tradeId: args.offerId, fileContents: false },
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getOfferRecord(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_current_derivation_index', async () => {
    const expected = [
      new Message({
        command: 'get_current_derivation_index',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getCurrentDerivationIndex();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls extend_derivation_index with the correct parameters', async () => {
    const args = { index: 1 };
    const expected = [
      new Message({
        command: 'extend_derivation_index',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.extendDerivationIndex(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls sign_message_by_address with the correct parameters', async () => {
    const args = { address: 'test_address', message: 'test_message' };
    const expected = [
      new Message({
        command: 'sign_message_by_address',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.signMessageByAddress(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls sign_message_by_id with the correct parameters', async () => {
    const args = { id: 'test_id', message: 'test_message' };
    const expected = [
      new Message({
        command: 'sign_message_by_id',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.signMessageById(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls get_notifications with the correct parameters', async () => {
    const args = { ids: ['test_id_1', 'test_id_2'], start: 0, end: 2 };
    const expected = [
      new Message({
        command: 'get_notifications',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.getNotifications(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls delete_notifications with the correct parameters', async () => {
    const args = { ids: ['test_id_1', 'test_id_2'] };
    const expected = [
      new Message({
        command: 'delete_notifications',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.deleteNotifications(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls send_notification with the correct parameters', async () => {
    const args = { target: 'test_target', message: 'test_message', amount: '10', fee: '1' };
    const expected = [
      new Message({
        command: 'send_notification',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.sendNotification(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls verify_signature with the correct parameters', async () => {
    const args = {
      message: 'test_message',
      pubkey: 'test_pubkey',
      signature: 'test_signature',
      address: 'test_address',
      signingMode: 'test_mode',
    };
    const expected = [
      new Message({
        command: 'verify_signature',
        data: args,
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.verifySignature(args);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });

  it('calls set_wallet_resync_on_startup', async () => {
    const expected = [
      new Message({
        command: 'set_wallet_resync_on_startup',
        data: {},
        destination: 'chia_wallet',
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.resyncWallet();
    expect(client.send).toHaveBeenCalledWith(...expected);
  });
});
