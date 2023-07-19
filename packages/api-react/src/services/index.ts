import * as client from './client';
import * as daemon from './daemon';
import * as farmer from './farmer';
import * as fullNode from './fullNode';
import * as harvester from './harvester';
import * as plotter from './plotter';
import * as wallet from './wallet';

export const {
  clientApi,

  useCloseMutation,
  useGetStateQuery,
  useClientStartServiceMutation,
  useClientStopServiceMutation,
} = client;

// daemon hooks
export const {
  daemonApi,

  useDaemonPingQuery,
  useGetKeyringStatusQuery,
  useStartServiceMutation,
  useStopServiceMutation,
  useIsServiceRunningQuery,
  useRunningServicesQuery,
  useSetKeyringPassphraseMutation,
  useRemoveKeyringPassphraseMutation,
  useMigrateKeyringMutation,
  useUnlockKeyringMutation,
  useGetVersionQuery,
  useGetKeysForPlottingQuery,

  useGetPlottersQuery,
  useStopPlottingMutation,
  useStartPlottingMutation,

  useAddPrivateKeyMutation,
  useGetKeyQuery,
  useGetKeysQuery,
  useGetWalletAddressesQuery,
  useSetLabelMutation,
  useDeleteLabelMutation,
} = daemon;

// farmer hooks
export const {
  farmerApi,

  useFarmerPingQuery,
  useGetHarvestersQuery,
  useGetHarvestersSummaryQuery,
  useGetHarvesterPlotsValidQuery,
  useGetHarvesterPlotsDuplicatesQuery,
  useGetHarvesterPlotsInvalidQuery,
  useGetHarvesterPlotsKeysMissingQuery,
  useGetRewardTargetsQuery,
  useSetRewardTargetsMutation,
  useGetFarmerConnectionsQuery,
  useOpenFarmerConnectionMutation,
  useCloseFarmerConnectionMutation,
  useGetPoolLoginLinkQuery,
  useGetSignagePointsQuery,
  useGetPoolStateQuery,
  useSetPayoutInstructionsMutation,
  useGetNewFarmingInfoQuery,
  useGetMissingSignagePointsQuery,
  useResetMissingSignagePointsMutation,
  useGetFilterChallengeStatQuery,
  useResetFilterChallengeStatMutation,
  useGetPartialStatsOffsetQuery,
  useResetPartialStatsMutation,
} = farmer;

// full node hooks
export const {
  fullNodeApi,

  useFullNodePingQuery,
  useGetBlockRecordsQuery,
  useGetUnfinishedBlockHeadersQuery,
  useGetBlockchainStateQuery,
  useGetFullNodeConnectionsQuery,
  useOpenFullNodeConnectionMutation,
  useCloseFullNodeConnectionMutation,
  useGetBlockQuery,
  useGetBlockRecordQuery,
  useGetFeeEstimateQuery,
} = fullNode;

// wallet hooks
export const {
  walletApi,

  useWalletPingQuery,
  useGetLoggedInFingerprintQuery,
  useGetWalletsQuery,
  useGetTransactionQuery,
  useGetTransactionMemoMutation,
  useGetTransactionAsyncMutation,
  useGetPwStatusQuery,
  usePwAbsorbRewardsMutation,
  usePwJoinPoolMutation,
  usePwSelfPoolMutation,
  useCreateNewWalletMutation,
  useDeleteUnconfirmedTransactionsMutation,
  useGetWalletBalanceQuery,
  useGetWalletBalancesQuery,
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
  useLazyGetTimestampForHeightQuery,
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

  // CAT wallet hooks
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

  // PlotNFTs
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
  useMintNFTMutation,
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

  // VC (Verifiable Credentials)
  useGetVCQuery,
  useGetVCListQuery,
  useSpendVCMutation,
  useAddVCProofsMutation,
  useGetProofsForRootQuery,
  useLazyGetProofsForRootQuery,
  useRevokeVCMutation,
  // clawback
  useSetAutoClaimMutation,
  useGetAutoClaimQuery,
  useSpendClawbackCoinsMutation,
} = wallet;

// harvester hooks
export const {
  harvesterApi,

  useHarvesterPingQuery,
  useRefreshPlotsMutation,
  useDeletePlotMutation,
  useGetPlotDirectoriesQuery,
  useAddPlotDirectoryMutation,
  useRemovePlotDirectoryMutation,
  useGetFarmingInfoQuery,
  useGetHarvesterConfigQuery,
  useUpdateHarvesterConfigMutation,
} = harvester;

// plotter hooks
export const {
  plotterApi,

  useGetPlotQueueQuery,
  // useStopPlottingMutation,
  // useStartPlottingMutation,
} = plotter;
