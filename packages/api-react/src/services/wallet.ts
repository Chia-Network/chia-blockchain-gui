/* eslint-disable no-param-reassign -- This file use Immer */
import { CAT, DID, Farmer, NFT, Pool, WalletService, WalletType, toBech32m, VC } from '@chia-network/api';
import type { NFTInfo, Transaction, Wallet, WalletBalance } from '@chia-network/api';
import BigNumber from 'bignumber.js';

import api, { baseQuery } from '../api';
import normalizePoolState from '../utils/normalizePoolState';
import onCacheEntryAddedInvalidate from '../utils/onCacheEntryAddedInvalidate';
import { query, mutation } from '../utils/reduxToolkitEndpointAbstractions';

const apiWithTag = api.enhanceEndpoints({
  addTagTypes: [
    'Address',
    'CATWalletInfo',
    'DID',
    'DIDCoinInfo',
    'DIDInfo',
    'DIDName',
    'DIDPubKey',
    'DIDRecoveryInfo',
    'DIDRecoveryList',
    'DIDWallet',
    'Keys',
    'LoggedInFingerprint',
    'NFTCount',
    'NFTInfo',
    'NFTRoyalties',
    'NFTWalletWithDID',
    'OfferCounts',
    'OfferTradeRecord',
    'PlotNFT',
    'PoolWalletStatus',
    'TransactionCount',
    'Transactions',
    'WalletBalance',
    'WalletConnections',
    'Wallets',
    'DerivationIndex',
    'CATs',
    'DaemonKey',
    'Notification',
  ],
});

export const walletApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    walletPing: query(build, WalletService, 'ping'),

    getLoggedInFingerprint: query(build, WalletService, 'getLoggedInFingerprint', {
      transformResponse: (response) => response.fingerprint,
      providesTags: ['LoggedInFingerprint'],
    }),

    // TODO refactor
    getWallets: build.query<Wallet[], { includeData?: boolean } | void>({
      // eslint-disable-next-line @typescript-eslint/default-param-last -- cannot change order
      async queryFn(args = { includeData: false }, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const { data, error } = await fetchWithBQ({
            command: 'getWallets',
            service: WalletService,
            args,
          });

          if (error) {
            throw error as Error;
          }

          const wallets = data?.wallets;
          if (!wallets) {
            throw new Error('List of the wallets is not defined');
          }

          return {
            data: await Promise.all(
              wallets.map(async (wallet: Wallet) => {
                const { type } = wallet;
                const meta: any = {};
                if (type === WalletType.CAT) {
                  // get CAT asset
                  const { data: assetData, error: assetError } = await fetchWithBQ({
                    command: 'getAssetId',
                    service: CAT,
                    args: { walletId: wallet.id },
                  });

                  if (assetError) {
                    throw assetError as Error;
                  }

                  meta.assetId = assetData.assetId;

                  // get CAT name
                  const { data: nameData, error: nameError } = await fetchWithBQ({
                    command: 'getName',
                    service: CAT,
                    args: { walletId: wallet.id },
                  });

                  if (nameError) {
                    throw nameError as Error;
                  }

                  meta.name = nameData.name;
                } else if (type === WalletType.NFT) {
                  // get DID assigned to the NFT Wallet (if any)
                  const { data: didData, error: didError } = await fetchWithBQ({
                    command: 'getNftWalletDid',
                    service: NFT,
                    args: { walletId: wallet.id },
                  });

                  if (didError) {
                    throw didError as Error;
                  }

                  meta.did = didData.didId;
                }

                return {
                  ...wallet,
                  meta,
                };
              })
            ),
          };
        } catch (error) {
          return {
            error,
          };
        }
      },
      // transformResponse: (response) => response.wallets,
      providesTags(result) {
        return result
          ? [...result.map(({ id }) => ({ type: 'Wallets', id } as const)), { type: 'Wallets', id: 'LIST' }]
          : [{ type: 'Wallets', id: 'LIST' }];
      },
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onWalletCreated',
          service: WalletService,
          endpoint: 'getWallets',
        },
      ]),
    }),

    getTransaction: query(build, WalletService, 'getTransaction', {
      transformResponse: (response) => response.transaction,
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onTransactionUpdate',
          service: WalletService,
          onUpdate: (draft, data, { transactionId }) => {
            const {
              additionalData: { transaction },
            } = data;

            if (transaction.name === transactionId) {
              Object.assign(draft, transaction);
            }
          },
        },
      ]),
    }),

    getTransactionMemo: mutation(build, WalletService, 'getTransactionMemo', {
      transformResponse: (response) => {
        const id = Object.keys(response)[0];
        return {
          [id]: response[id][id]?.[0],
        };
      },
    }),

    getPwStatus: query(build, WalletService, 'getPwStatus', {
      providesTags(result, _error, { walletId }) {
        return result ? [{ type: 'PoolWalletStatus', id: walletId }] : [];
      },
    }),

    pwAbsorbRewards: mutation(build, WalletService, 'pwAbsorbRewards', {
      invalidatesTags: [
        { type: 'Transactions', id: 'LIST' },
        { type: 'PlotNFT', id: 'LIST' },
      ],
    }),

    pwJoinPool: mutation(build, WalletService, 'pwJoinPool', {
      invalidatesTags: [
        { type: 'Transactions', id: 'LIST' },
        { type: 'PlotNFT', id: 'LIST' },
      ],
    }),

    pwSelfPool: mutation(build, WalletService, 'pwSelfPool', {
      invalidatesTags: [
        { type: 'Transactions', id: 'LIST' },
        { type: 'PlotNFT', id: 'LIST' },
      ],
    }),

    createNewWallet: mutation(build, WalletService, 'createNewWallet', {
      invalidatesTags: [
        { type: 'Wallets', id: 'LIST' },
        { type: 'DIDWallet', id: 'LIST' },
      ],
    }),

    deleteUnconfirmedTransactions: mutation(build, WalletService, 'deleteUnconfirmedTransactions', {
      invalidatesTags: (_result, _error, { walletId }) => [
        { type: 'Transactions', id: 'LIST' },
        { type: 'TransactionCount', id: walletId },
      ],
    }),

    getWalletBalance: query(build, WalletService, 'getWalletBalance', {
      transformResponse: (response) => {
        const {
          walletBalance,
          walletBalance: { confirmedWalletBalance, unconfirmedWalletBalance },
        } = response;

        const pendingBalance = new BigNumber(unconfirmedWalletBalance).minus(confirmedWalletBalance);
        const pendingTotalBalance = new BigNumber(confirmedWalletBalance).plus(pendingBalance);

        return {
          ...walletBalance,
          pendingBalance,
          pendingTotalBalance,
        };
      },
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onCoinAdded',
          service: WalletService,
          endpoint: 'getWalletBalance',
        },
        {
          command: 'onCoinRemoved',
          service: WalletService,
          endpoint: 'getWalletBalance',
        },
        {
          command: 'onPendingTransaction',
          service: WalletService,
          endpoint: 'getWalletBalance',
        },
        {
          command: 'onOfferAdded',
          service: WalletService,
          endpoint: 'getWalletBalance',
        },
        {
          command: 'onOfferUpdated',
          service: WalletService,
          endpoint: 'getWalletBalance',
        },
      ]),
    }),

    getFarmedAmount: query(build, WalletService, 'getFarmedAmount', {
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onCoinAdded',
          service: WalletService,
          endpoint: 'getFarmedAmount',
        },
        {
          command: 'onCoinRemoved',
          service: WalletService,
          endpoint: 'getFarmedAmount',
        },
      ]),
    }),

    // TODO refactor
    sendTransaction: build.mutation<
      any,
      {
        walletId: number;
        amount: string;
        fee: string;
        address: string;
        memos?: string[];
        waitForConfirmation?: boolean;
      }
    >({
      async queryFn(args, queryApi, _extraOptions, fetchWithBQ) {
        let subscribeResponse: any;

        function unsubscribe() {
          if (subscribeResponse) {
            subscribeResponse.data();
            subscribeResponse = undefined;
          }
        }

        try {
          const { waitForConfirmation, ...restArgs } = args;

          return {
            // eslint-disable-next-line no-async-promise-executor -- Not refactoring from `new Promise` to keep consistent
            data: await new Promise(async (resolve, reject) => {
              const updatedTransactions: Transaction[] = [];
              let transactionName: string;

              function processUpdates() {
                if (!transactionName) {
                  return;
                }

                const transaction = updatedTransactions.find((trx) => {
                  if (trx.name !== transactionName) {
                    return false;
                  }

                  if (!trx?.sentTo?.length) {
                    return false;
                  }

                  const validSentTo = trx.sentTo.find((record) => {
                    const [, , error] = record;

                    if (error === 'NO_TRANSACTIONS_WHILE_SYNCING') {
                      return false;
                    }

                    return true;
                  });

                  return !!validSentTo;
                });

                if (transaction) {
                  resolve({
                    transaction,
                    transactionId: transaction.name,
                  });
                }
              }

              // bind all changes related to transactions
              if (waitForConfirmation) {
                // subscribing to tx_updates
                subscribeResponse = await baseQuery(
                  {
                    command: 'onTransactionUpdate',
                    service: WalletService,
                    args: [
                      (data: any) => {
                        const {
                          additionalData: { transaction },
                        } = data;

                        updatedTransactions.push(transaction);
                        processUpdates();
                      },
                    ],
                  },
                  queryApi
                );
              }

              // make transaction
              const { data: sendTransactionData, error } = await fetchWithBQ({
                command: 'sendTransaction',
                service: WalletService,
                args: restArgs,
              });

              if (error) {
                reject(error);
                return;
              }

              if (!waitForConfirmation) {
                resolve(sendTransactionData);
                return;
              }

              const { transaction } = sendTransactionData;
              if (!transaction) {
                reject(new Error('Transaction is not present in response'));
                return;
              }

              transactionName = transaction.name;
              updatedTransactions.push(transaction);
              processUpdates();
            }),
          };
        } catch (error) {
          console.error('error trx', error);
          return {
            error,
          };
        } finally {
          unsubscribe();
        }
      },
      invalidatesTags: [{ type: 'Transactions', id: 'LIST' }],
    }),

    generateMnemonic: mutation(build, WalletService, 'generateMnemonic', {
      transformResponse: (response) => response.mnemonic,
    }),

    getPublicKeys: query(build, WalletService, 'getPublicKeys', {
      transformResponse: (response) => response.publicKeyFingerprints,
      providesTags: (keys) =>
        keys
          ? [...keys.map((key) => ({ type: 'Keys', id: key } as const)), { type: 'Keys', id: 'LIST' }]
          : [{ type: 'Keys', id: 'LIST' }],
    }),

    deleteKey: mutation(build, WalletService, 'deleteKey', {
      invalidatesTags: (_result, _error, { fingerprint }) => [
        { type: 'Keys', id: fingerprint },
        { type: 'Keys', id: 'LIST' },
        { type: 'DaemonKey', id: fingerprint },
        { type: 'DaemonKey', id: 'LIST' },
      ],
    }),

    checkDeleteKey: mutation(build, WalletService, 'checkDeleteKey'),

    deleteAllKeys: mutation(build, WalletService, 'deleteAllKeys', {
      invalidatesTags: [
        { type: 'Keys', id: 'LIST' },
        { type: 'DaemonKey', id: 'LIST' },
      ],
    }),

    logIn: mutation(build, WalletService, 'logIn', {
      invalidatesTags: ['LoggedInFingerprint', 'Address', 'Wallets', 'Transactions', 'WalletBalance', 'Notification'],
    }),

    getPrivateKey: query(build, WalletService, 'getPrivateKey', {
      transformResponse: (response) => response.privateKey,
    }),

    getTransactions: query(build, WalletService, 'getTransactions', {
      transformResponse: (response) => response.transactions,
      providesTags(result) {
        return result
          ? [
              ...result.map(({ name }) => ({ type: 'Transactions', id: name } as const)),
              { type: 'Transactions', id: 'LIST' },
            ]
          : [{ type: 'Transactions', id: 'LIST' }];
      },
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onCoinAdded',
          service: WalletService,
          endpoint: 'getTransactions',
        },
        {
          command: 'onCoinRemoved',
          service: WalletService,
          endpoint: 'getTransactions',
        },
        {
          command: 'onPendingTransaction',
          service: WalletService,
          endpoint: 'getTransactions',
        },
      ]),
    }),

    getTransactionsCount: query(build, WalletService, 'getTransactionsCount', {
      transformResponse: (response) => response.count,
      providesTags: (result, _error, { walletId }) => (result ? [{ type: 'TransactionCount', id: walletId }] : []),
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onCoinAdded',
          service: WalletService,
          endpoint: 'getTransactionsCount',
        },
        {
          command: 'onCoinRemoved',
          service: WalletService,
          endpoint: 'getTransactionsCount',
        },
        {
          command: 'onPendingTransaction',
          service: WalletService,
          endpoint: 'getTransactionsCount',
        },
      ]),
    }),

    getCurrentAddress: build.query<
      string,
      {
        walletId: number;
      }
    >({
      query: ({ walletId }) => ({
        command: 'getNextAddress',
        service: WalletService,
        args: { walletId, newAddress: false },
      }),
      transformResponse: (response) => response.address,
      providesTags: (result, _error, { walletId }) => (result ? [{ type: 'Address', id: walletId }] : []),
    }),

    getNextAddress: mutation(build, WalletService, 'getNextAddress', {
      transformResponse: (response) => response.address,
      invalidatesTags: (result, _error, { walletId }) => (result ? [{ type: 'Address', id: walletId }] : []),
    }),

    farmBlock: mutation(build, WalletService, 'farmBlock'),

    getTimestampForHeight: query(build, WalletService, 'getTimestampForHeight'),

    getHeightInfo: query(build, WalletService, 'getHeightInfo', {
      transformResponse: (response) => response.height,
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onSyncChanged',
          service: WalletService,
          endpoint: 'getHeightInfo',
        },
        {
          command: 'onNewBlock',
          service: WalletService,
          endpoint: 'getHeightInfo',
        },
      ]),
    }),

    getCurrentDerivationIndex: query(build, WalletService, 'getCurrentDerivationIndex', {
      providesTags: (result) => (result ? [{ type: 'DerivationIndex' }] : []),
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onNewDerivationIndex',
          service: WalletService,
          onUpdate: (draft, data) => {
            draft.index = data?.additionalData?.index;
          },
        },
      ]),
    }),

    extendDerivationIndex: mutation(build, WalletService, 'extendDerivationIndex', {
      invalidatesTags: [{ type: 'DerivationIndex' }],
    }),

    getNetworkInfo: query(build, WalletService, 'getNetworkInfo'),

    getSyncStatus: query(build, WalletService, 'getSyncStatus', {
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onSyncChanged',
          service: WalletService,
          endpoint: 'getSyncStatus',
        },
        {
          command: 'onNewBlock',
          service: WalletService,
          endpoint: 'getSyncStatus',
        },
      ]),
    }),

    getWalletConnections: query(build, WalletService, 'getConnections', {
      transformResponse: (response) => response.connections,
      providesTags: (connections) =>
        connections
          ? [
              ...connections.map(({ nodeId }) => ({ type: 'WalletConnections', id: nodeId } as const)),
              { type: 'WalletConnections', id: 'LIST' },
            ]
          : [{ type: 'WalletConnections', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onConnections',
          service: WalletService,
          onUpdate: (draft, data) => {
            // empty base array
            draft.splice(0);

            // assign new items
            Object.assign(draft, data.connections);
          },
        },
      ]),
    }),

    // Offers

    getAllOffers: query(build, WalletService, 'getAllOffers', {
      transformResponse: (response) => {
        if (!response.offers) {
          return response.tradeRecords;
        }
        return response.tradeRecords.map((tradeRecord, index) => ({
          ...tradeRecord,
          _offerData: response.offers?.[index],
        }));
      },
      providesTags(result) {
        return result
          ? [
              ...result.map(({ tradeId }) => ({ type: 'OfferTradeRecord', id: tradeId } as const)),
              { type: 'OfferTradeRecord', id: 'LIST' },
            ]
          : [{ type: 'OfferTradeRecord', id: 'LIST' }];
      },
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onCoinAdded',
          service: WalletService,
          endpoint: 'getAllOffers',
        },
        {
          command: 'onCoinRemoved',
          service: WalletService,
          endpoint: 'getAllOffers',
        },
        {
          command: 'onPendingTransaction',
          service: WalletService,
          endpoint: 'getAllOffers',
        },
      ]),
    }),

    getOffersCount: query(build, WalletService, 'getOffersCount', {
      providesTags: ['OfferCounts'],
    }),

    createOfferForIds: mutation(build, WalletService, 'createOfferForIds', {
      invalidatesTags: [{ type: 'OfferTradeRecord', id: 'LIST' }, 'OfferCounts'],
    }),

    cancelOffer: mutation(build, WalletService, 'cancelOffer', {
      invalidatesTags: (_result, _error, { tradeId }) => [{ type: 'OfferTradeRecord', id: tradeId }],
    }),

    checkOfferValidity: mutation(build, WalletService, 'checkOfferValidity'),

    takeOffer: mutation(build, WalletService, 'takeOffer', {
      invalidatesTags: [{ type: 'OfferTradeRecord', id: 'LIST' }, 'OfferCounts'],
    }),

    getOfferSummary: mutation(build, WalletService, 'getOfferSummary'),

    getOfferData: mutation(build, WalletService, 'getOfferData'),

    getOfferRecord: mutation(build, WalletService, 'getOfferRecord'),

    // Pool
    createNewPoolWallet: mutation(build, Pool, 'createNewPoolWallet', {
      invalidatesTags: [
        { type: 'Wallets', id: 'LIST' },
        { type: 'Transactions', id: 'LIST' },
      ],
    }),

    // CAT
    createNewCATWallet: mutation(build, CAT, 'createNewCatWallet', {
      invalidatesTags: [
        { type: 'Wallets', id: 'LIST' },
        { type: 'Transactions', id: 'LIST' },
      ],
    }),

    createCATWalletForExisting: mutation(build, CAT, 'createWalletForExisting', {
      invalidatesTags: [
        { type: 'Wallets', id: 'LIST' },
        { type: 'Transactions', id: 'LIST' },
      ],
    }),

    getCATWalletInfo: query(build, CAT, 'getWalletIdAndName', {
      providesTags: (result, _error, { assetId }) => (result ? [{ type: 'CATWalletInfo', id: assetId }] : []),
    }),

    getCATAssetId: query(build, CAT, 'getAssetId', {
      transformResponse: (response) => response.assetId,
    }),

    getCatList: query(build, CAT, 'getCatList', {
      transformResponse: (response) => response.catList,
      providesTags(result) {
        return result
          ? [...result.map(({ assetId }) => ({ type: 'CATs', id: assetId } as const)), { type: 'CATs', id: 'LIST' }]
          : [{ type: 'CATs', id: 'LIST' }];
      },
    }),

    getCATName: query(build, CAT, 'getName', {
      transformResponse: (response) => response.name,
    }),

    setCATName: mutation(build, CAT, 'setName', {
      invalidatesTags: [
        { type: 'Wallets', id: 'LIST' },
        { type: 'CATs', id: 'LIST' },
      ],
    }),

    getStrayCats: query(build, CAT, 'getStrayCats', {
      transformResponse: (response) => response.strayCats,
    }),

    // TODO refactor
    spendCAT: build.mutation<
      any,
      {
        walletId: number;
        address: string;
        amount: string;
        fee: string;
        memos?: string[];
        waitForConfirmation?: boolean;
      }
    >({
      async queryFn(args, queryApi, _extraOptions, fetchWithBQ) {
        let subscribeResponse: any;

        function unsubscribe() {
          if (subscribeResponse) {
            subscribeResponse.data();
            subscribeResponse = undefined;
          }
        }

        try {
          const { waitForConfirmation, ...restArgs } = args;

          return {
            // eslint-disable-next-line no-async-promise-executor -- Not refactoring from `new Promise` to keep consistent
            data: await new Promise(async (resolve, reject) => {
              const updatedTransactions: Transaction[] = [];
              let transactionName: string;

              function processUpdates() {
                if (!transactionName) {
                  console.warn(`Transaction name is not defined`, updatedTransactions);
                  return;
                }

                const transaction = updatedTransactions.find(
                  (trx) => trx.name === transactionName && !!trx?.sentTo?.length
                );

                if (transaction) {
                  resolve({
                    transaction,
                    transactionId: transaction.name,
                  });
                }
              }

              // bind all changes related to transactions
              if (waitForConfirmation) {
                // subscribing to tx_updates
                subscribeResponse = await baseQuery(
                  {
                    command: 'onTransactionUpdate',
                    service: WalletService,
                    args: [
                      (data: any) => {
                        const {
                          additionalData: { transaction },
                        } = data;

                        updatedTransactions.push(transaction);
                        processUpdates();
                      },
                    ],
                  },
                  queryApi
                );
              }

              // make transaction

              const { data: sendTransactionData, error } = await fetchWithBQ({
                command: 'spend',
                service: CAT,

                args: restArgs,
              });

              if (error) {
                reject(error);
                return;
              }

              if (!waitForConfirmation) {
                resolve(sendTransactionData);
                return;
              }

              const { transaction } = sendTransactionData;
              if (!transaction) {
                reject(new Error('Transaction is not present in response'));
              }

              transactionName = transaction.name;
              updatedTransactions.push(transaction);
              processUpdates();
            }),
          };
        } catch (error) {
          return {
            error,
          };
        } finally {
          unsubscribe();
        }
      },
      invalidatesTags: [{ type: 'Transactions', id: 'LIST' }],
    }),

    // TODO refactor
    addCATToken: build.mutation<
      any,
      {
        assetId: string;
        name: string;
        fee: string;
      }
    >({
      async queryFn({ name, ...restArgs }, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const { data, error } = await fetchWithBQ({
            command: 'createWalletForExisting',
            service: CAT,
            args: restArgs,
          });

          if (error) {
            throw error as Error;
          }

          const walletId = data?.walletId;
          if (!walletId) {
            throw new Error('Wallet id is not defined');
          }

          await fetchWithBQ({
            command: 'setName',
            service: CAT,
            args: { walletId, name },
          });

          return {
            data: walletId,
          };
        } catch (error) {
          return {
            error,
          };
        }
      },
      invalidatesTags: [
        { type: 'Wallets', id: 'LIST' },
        { type: 'Transactions', id: 'LIST' },
      ],
    }),

    // PlotNFTs

    // TODO refactor

    getPlotNFTs: build.query<Object, undefined>({
      async queryFn(_args, { signal }, _extraOptions, fetchWithBQ) {
        try {
          const [wallets, poolStates] = await Promise.all([
            (async () => {
              const { data, error } = await fetchWithBQ({
                command: 'getWallets',
                service: WalletService,
              });

              if (error) {
                throw error as Error;
              }

              if (!data?.wallets) {
                throw new Error('List of the wallets is not defined');
              }

              return data.wallets;
            })(),
            (async () => {
              const { data, error } = await fetchWithBQ({
                command: 'getPoolState',
                service: Farmer,
              });

              if (error) {
                throw error as Error;
              }

              const poolState = data?.poolState;
              if (!poolState) {
                throw new Error('Pool state is not defined');
              }

              return poolState;
            })(),
          ]);

          if (signal.aborted) {
            throw new Error('Query was aborted');
          }

          // filter pool wallets
          const poolWallets = wallets?.filter((wallet: any) => wallet.type === WalletType.POOLING_WALLET) ?? [];

          const [poolWalletStates, walletBalances] = await Promise.all([
            await Promise.all(
              poolWallets.map(async (wallet: any) => {
                const { data, error } = await fetchWithBQ({
                  command: 'getPwStatus',
                  service: WalletService,
                  args: { walletId: wallet.id },
                });

                if (error) {
                  throw error as Error;
                }

                return {
                  ...data?.state,
                  walletId: wallet.id,
                };
              })
            ),
            await Promise.all<WalletBalance>(
              poolWallets.map(async (wallet: any) => {
                const { data, error } = await fetchWithBQ({
                  command: 'getWalletBalance',
                  service: WalletService,
                  args: { walletId: wallet.id },
                });

                if (error) {
                  throw error as Error;
                }

                return data?.walletBalance;
              })
            ),
          ]);

          if (signal.aborted) {
            throw new Error('Query was aborted');
          }

          // combine poolState and poolWalletState
          const nfts: any = [];
          const external: any = [];

          poolStates.forEach((poolStateItem: any) => {
            const poolWalletStatus = poolWalletStates.find(
              (item) => item.launcherId === poolStateItem.poolConfig.launcherId
            );
            if (!poolWalletStatus) {
              external.push({
                poolState: normalizePoolState(poolStateItem),
              });
              return;
            }

            const walletBalance = walletBalances.find((item) => item?.walletId === poolWalletStatus.walletId);

            if (!walletBalance) {
              external.push({
                poolState: normalizePoolState(poolStateItem),
              });
              return;
            }

            nfts.push({
              poolState: normalizePoolState(poolStateItem),
              poolWalletStatus,
              walletBalance,
            });
          });

          return {
            data: {
              nfts,
              external,
            },
          };
        } catch (error) {
          return {
            error,
          };
        }
      },
      providesTags: [{ type: 'PlotNFT', id: 'LIST' }],
    }),

    // DID

    createNewDIDWallet: mutation(build, DID, 'createNewDIDWallet', {
      invalidatesTags: [
        { type: 'Wallets', id: 'LIST' },
        { type: 'DIDWallet', id: 'LIST' },
        { type: 'Transactions', id: 'LIST' },
      ],
    }),

    getDIDName: query(build, DID, 'getDidName', {
      providesTags: (result, _error, { walletId }) => (result ? [{ type: 'DIDName', id: walletId }] : []),
    }),

    setDIDName: mutation(build, DID, 'setDIDName', {
      invalidatesTags: (_result, _error, { walletId }) => [
        { type: 'Wallets', id: walletId },
        { type: 'DIDWallet', id: walletId },
        { type: 'DIDName', id: walletId },
      ],
    }),

    updateDIDRecoveryIds: mutation(build, DID, 'updateRecoveryIds', {
      invalidatesTags: (_result, _error, { walletId }) => [
        { type: 'Wallets', id: walletId },
        { type: 'DIDRecoveryList', id: walletId },
      ],
    }),

    getDIDPubKey: query(build, DID, 'getPubKey', {
      providesTags: (result, _error, { walletId }) => (result ? [{ type: 'DIDPubKey', id: walletId }] : []),
    }),

    getDID: query(build, DID, 'getDid', {
      providesTags: (result, _error, { walletId }) => (result ? [{ type: 'DID', id: walletId }] : []),
    }),

    // TODO refactor
    getDIDs: build.query<Wallet[], undefined>({
      async queryFn(_args, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const { data, error } = await fetchWithBQ({
            command: 'getWallets',
            service: WalletService,
          });

          if (error) {
            throw error as Error;
          }

          const wallets = data?.wallets;
          if (!wallets) {
            throw new Error('Wallets are not defined');
          }

          const didWallets = wallets.filter((wallet: any) => wallet.type === WalletType.DECENTRALIZED_ID);

          return {
            data: await Promise.all(
              didWallets.map(async (wallet: Wallet) => {
                const { data: dataLocal, error: errorLocal } = await fetchWithBQ({
                  command: 'getDid',
                  service: DID,
                  args: { walletId: wallet.id },
                });

                if (errorLocal) {
                  throw errorLocal as Error;
                }

                const { myDid } = dataLocal;

                return {
                  ...wallet,
                  myDid,
                };
              })
            ),
          };
        } catch (error) {
          return {
            error,
          };
        }
      },
      providesTags(result) {
        return result
          ? [...result.map(({ id }) => ({ type: 'DIDWallet', id } as const)), { type: 'DIDWallet', id: 'LIST' }]
          : [{ type: 'DIDWallet', id: 'LIST' }];
      },
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onWalletCreated',
          service: WalletService,
          endpoint: 'getWallets',
        },
      ]),
    }),

    // spendDIDRecovery: did_recovery_spend needs an RPC change (attest_filenames -> attest_file_contents)

    getDIDRecoveryList: query(build, DID, 'getRecoveryList', {
      providesTags: (result, _error, { walletId }) => (result ? [{ type: 'DIDRecoveryList', id: walletId }] : []),
    }),

    // createDIDAttest: did_create_attest needs an RPC change (remove filename param, return file contents)

    getDIDInformationNeededForRecovery: query(build, DID, 'getInformationNeededForRecovery', {
      providesTags: (result, _error, { walletId }) => (result ? [{ type: 'DIDRecoveryInfo', id: walletId }] : []),
    }),

    getDIDCurrentCoinInfo: query(build, DID, 'getCurrentCoinInfo', {
      providesTags: (result, _error, { walletId }) => (result ? [{ type: 'DIDCoinInfo', id: walletId }] : []),
    }),

    getDIDInfo: query(build, DID, 'getDidInfo', {
      providesTags: (result, _error, { coinOrDIDId }) => (result ? [{ type: 'DIDInfo', id: coinOrDIDId }] : []),
    }),

    // createDIDBackup: did_create_backup_file needs an RPC change (remove filename param, return file contents)

    // NFTs

    calculateRoyaltiesForNFTs: query(build, NFT, 'calculateRoyalties', {
      providesTags: ['NFTRoyalties'],
      transformResponse: (response) => {
        // Move royalties to a 'royalties' key to avoid co-mingling with success/error keys
        const { success, ...royalties } = response;
        return { royalties: { ...royalties }, success };
      },
    }),

    // TODO refactor
    getNFTsByNFTIDs: build.query<any, { nftIds: string[] }>({
      async queryFn(args, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const nfts = await Promise.all(
            args.nftIds.map(async (nftId) => {
              const { data: nftData, error: nftError } = await fetchWithBQ({
                command: 'getNftInfo',
                service: NFT,
                args: { coinId: nftId },
              });

              if (nftError) {
                throw nftError as Error;
              }

              // Add bech32m-encoded NFT identifier
              const updatedNFT = {
                ...nftData.nftInfo,
                $nftId: toBech32m(nftData.nftInfo.launcherId, 'nft'),
              };

              return updatedNFT;
            })
          );

          return {
            data: nfts,
          };
        } catch (error) {
          return {
            error,
          };
        }
      },
    }),

    getNFTsCount: build.query<{ [walletId: number]: number; total: number }, { walletIds: number[] }>({
      async queryFn({ walletIds }, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const countByWalletId: Record<number, number> = {};
          await Promise.all(
            walletIds.map(async (walletId) => {
              const { data: nftCountData, error: nftCountError } = await fetchWithBQ({
                command: 'getNftsCount',
                service: NFT,
                args: { walletId },
              });

              if (nftCountError) {
                throw nftCountError as Error;
              }

              countByWalletId[walletId] = nftCountData.count;
            })
          );

          const total = Object.values(countByWalletId).reduce((a, b) => a + b, 0);

          return {
            data: {
              ...countByWalletId,
              total,
            },
          };
        } catch (error: any) {
          return {
            error,
          };
        }
      },
      providesTags: (countByWalletId) =>
        countByWalletId
          ? [...Object.entries(countByWalletId).map(([walletId]) => ({ type: 'NFTCount', id: walletId } as const))]
          : [],
    }),

    getNFTs: build.query<{ [walletId: number]: NFTInfo[] }, { walletIds: number[]; num: number; startIndex: number }>({
      async queryFn({ walletIds, num, startIndex }, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const nftData: { [walletId: number]: NFTInfo[] }[] = await Promise.all(
            walletIds.map(async (walletId) => {
              const { data: nftsData, error: nftsError } = await fetchWithBQ({
                command: 'getNfts',
                service: NFT,
                args: { walletId, num, startIndex },
              });

              if (nftsError) {
                throw nftsError as Error;
              }

              // Add bech32m-encoded NFT identifier
              const updatedNFTs = nftsData.nftList.map((nft: any) => ({
                ...nft,
                walletId,
                $nftId: toBech32m(nft.launcherId, 'nft'),
              }));

              return {
                [walletId]: updatedNFTs,
              };
            })
          );
          const nftsByWalletId: { [walletId: string]: NFTInfo[] } = {};
          nftData.forEach((entry) => {
            Object.entries(entry).forEach(([walletId, nfts]) => {
              nftsByWalletId[walletId] = nfts;
            });
          });
          return {
            data: nftsByWalletId,
          };
        } catch (error) {
          return {
            error,
          };
        }
      },
      providesTags: (nftsByWalletId, _error) =>
        nftsByWalletId
          ? [
              ...Object.entries(nftsByWalletId).flatMap(([_walletId, nfts]) =>
                nfts.map((nft) => ({ type: 'NFTInfo', id: nft.launcherId } as const))
              ),
              { type: 'NFTInfo', id: 'LIST' },
            ]
          : [{ type: 'NFTInfo', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onNFTCoinAdded',
          service: NFT,
          endpoint: 'getNFTs',
        },
        {
          command: 'onNFTCoinRemoved',
          service: NFT,
          endpoint: 'getNFTs',
        },
        {
          command: 'onNFTCoinUpdated',
          service: NFT,
          endpoint: 'getNFTs',
        },
      ]),
    }),

    getNFTWalletsWithDIDs: query(build, NFT, 'getNftWalletsWithDids', {
      transformResponse: (response) => response.nftWallets,
      providesTags: (result, _error) =>
        result
          ? [
              ...result.map(({ walletId }) => ({
                type: 'NFTWalletWithDID',
                id: walletId,
              })),
              { type: 'NFTWalletWithDID', id: 'LIST' },
            ]
          : [{ type: 'NFTWalletWithDID', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onWalletCreated',
          service: WalletService,
          endpoint: 'getNFTWalletsWithDIDs',
        },
      ]),
    }),

    // TODO refactor

    getNFTInfo: build.query<any, { coinId: string }>({
      async queryFn(args, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Slice off the '0x' prefix, if present
          const coinId = args.coinId.toLowerCase().startsWith('0x') ? args.coinId.slice(2) : args.coinId;

          if (coinId.length !== 64) {
            throw new Error('Invalid coinId');
          }

          const { data: nftData, error: nftError } = await fetchWithBQ({
            command: 'getNftInfo',
            service: NFT,
            args: { coinId },
          });

          if (nftError) {
            throw nftError as Error;
          }

          // Add bech32m-encoded NFT identifier
          const updatedNFT = {
            ...nftData.nftInfo,
            $nftId: toBech32m(nftData.nftInfo.launcherId, 'nft'),
          };

          return { data: updatedNFT };
        } catch (error) {
          return {
            error,
          };
        }
      },
      providesTags: (result, _error) => (result ? [{ type: 'NFTInfo', id: result.launcherId }] : []),
    }),

    transferNFT: mutation(build, NFT, 'transferNft', {
      invalidatesTags: (result, _error) => (result ? [{ type: 'NFTInfo', id: 'LIST' }] : []),
    }),

    setNFTDID: mutation(build, NFT, 'setNftDid', {
      invalidatesTags: (result, _error) =>
        result
          ? [
              { type: 'NFTInfo', id: 'LIST' },
              { type: 'NFTWalletWithDID', id: 'LIST' },
              { type: 'DIDWallet', id: 'LIST' },
            ]
          : [],
    }),

    setNFTStatus: mutation(build, NFT, 'setNftStatus', {
      invalidatesTags: (result, _error) => (result ? [{ type: 'NFTInfo', id: 'LIST' }] : []),
    }),

    signMessageByAddress: mutation(build, WalletService, 'signMessageByAddress'),

    signMessageById: mutation(build, WalletService, 'signMessageById'),

    resyncWallet: mutation(build, WalletService, 'resyncWallet'),

    // notifications

    getNotifications: query(build, NFT, 'getNotifications', {
      transformResponse: (response) => response.notifications,
      providesTags: (result, _error) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: 'Notification',
                id,
              })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, api, [
        {
          command: 'onNewOnChainNotification',
          service: WalletService,
          endpoint: 'getNotifications',
        },
      ]),
    }),

    deleteNotifications: mutation(build, WalletService, 'deleteNotifications', {
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    sendNotification: mutation(build, WalletService, 'sendNotification', {
      invalidatesTags: (result, _error) => (result ? [{ type: 'Notification', id: 'LIST' }] : []),
    }),

    verifySignature: mutation(build, WalletService, 'verifySignature'),

    getVC: query(build, VC, 'getVC', {
      transformResponse: (response) => response.vcRecord,
    }),

    getVCList: query(build, VC, 'getVCList'),

    spendVC: mutation(build, VC, 'spendVC'),

    addVCProofs: mutation(build, VC, 'addVCProofs'),

    getProofsForRoot: mutation(build, VC, 'getProofsForRoot'),

    revokeVC: mutation(build, VC, 'revokeVC'),
  }),
});

export const {
  useWalletPingQuery,
  useGetLoggedInFingerprintQuery,
  useGetWalletsQuery,
  useGetTransactionQuery,
  useGetTransactionMemoMutation,
  useGetPwStatusQuery,
  usePwAbsorbRewardsMutation,
  usePwJoinPoolMutation,
  usePwSelfPoolMutation,
  useCreateNewWalletMutation,
  useDeleteUnconfirmedTransactionsMutation,
  useGetWalletBalanceQuery,
  useGetFarmedAmountQuery,
  useSendTransactionMutation,
  useGenerateMnemonicMutation,
  useGetPublicKeysQuery,
  useDeleteKeyMutation,
  useCheckDeleteKeyMutation,
  useDeleteAllKeysMutation,
  useLogInMutation,
  useGetPrivateKeyQuery,
  useGetTransactionsQuery,
  useGetTransactionsCountQuery,
  useGetCurrentAddressQuery,
  useGetNextAddressMutation,
  useFarmBlockMutation,
  useGetTimestampForHeightQuery,
  useGetHeightInfoQuery,
  useGetNetworkInfoQuery,
  useGetSyncStatusQuery,
  useGetWalletConnectionsQuery,
  useGetAllOffersQuery,
  useGetOffersCountQuery,
  useCreateOfferForIdsMutation,
  useCancelOfferMutation,
  useCheckOfferValidityMutation,
  useTakeOfferMutation,
  useGetOfferSummaryMutation,
  useGetOfferDataMutation,
  useGetOfferRecordMutation,
  useGetCurrentDerivationIndexQuery,
  useExtendDerivationIndexMutation,
  useResyncWalletMutation,

  // Pool
  useCreateNewPoolWalletMutation,

  // CAT
  useCreateNewCATWalletMutation,
  useCreateCATWalletForExistingMutation,
  useGetCATWalletInfoQuery,
  useGetCATAssetIdQuery,
  useGetCatListQuery,
  useGetCATNameQuery,
  useSetCATNameMutation,
  useSpendCATMutation,
  useAddCATTokenMutation,
  useGetStrayCatsQuery,

  // PlotNFTS
  useGetPlotNFTsQuery,

  // DID
  useCreateNewDIDWalletMutation,
  useUpdateDIDRecoveryIdsMutation,
  useGetDIDPubKeyQuery,
  useGetDIDQuery,
  useGetDIDsQuery,
  useGetDIDNameQuery,
  useSetDIDNameMutation,
  useGetDIDRecoveryListQuery,
  useGetDIDInformationNeededForRecoveryQuery,
  useGetDIDCurrentCoinInfoQuery,
  useGetDIDInfoQuery,

  // NFTs
  useCalculateRoyaltiesForNFTsQuery,
  useGetNFTsByNFTIDsQuery,
  useGetNFTsCountQuery,
  useLazyGetNFTsCountQuery,
  useGetNFTsQuery,
  useLazyGetNFTsQuery,
  useGetNFTWalletsWithDIDsQuery,
  useGetNFTInfoQuery,
  useLazyGetNFTInfoQuery,
  useTransferNFTMutation,
  useSetNFTDIDMutation,
  useSetNFTStatusMutation,

  // sign
  useSignMessageByAddressMutation,
  useSignMessageByIdMutation,

  // notifications
  useGetNotificationsQuery,
  useDeleteNotificationsMutation,
  useSendNotificationMutation,

  // verify
  useVerifySignatureMutation,

  // VC
  useGetVCQuery,
  useGetVCListQuery,
  useSpendVCMutation,
  useAddVCProofsMutation,
  useRevokeVCMutation,
} = walletApi;
