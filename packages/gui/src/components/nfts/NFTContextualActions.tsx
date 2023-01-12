/* eslint-disable no-bitwise -- enable bitwise operators for this file */

import type { NFTInfo } from '@chia-network/api';
import { useSetNFTStatusMutation, useLocalStorage } from '@chia-network/api-react';
import { AlertDialog, DropdownActions, MenuItem, useOpenDialog } from '@chia-network/core';
import {
  LinkSmall as LinkSmallIcon,
  NFTsSmall as NFTsSmallIcon,
  OffersSmall as OffersSmallIcon,
} from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import {
  ArrowForward as TransferIcon,
  Cancel as CancelIcon,
  Link as LinkIcon,
  Download as DownloadIcon,
  PermIdentity as PermIdentityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DeleteForever as DeleteForeverIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ListItemIcon, Typography } from '@mui/material';
import React, { useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCopyToClipboard } from 'react-use';
import isURL from 'validator/lib/isURL';

import useBurnAddress from '../../hooks/useBurnAddress';
import useHiddenNFTs from '../../hooks/useHiddenNFTs';
import useNFTMetadataLRU from '../../hooks/useNFTMetadataLRU';
import useOpenUnsafeLink from '../../hooks/useOpenUnsafeLink';
import useViewNFTOnExplorer, { NFTExplorer } from '../../hooks/useViewNFTOnExplorer';
import NFTSelection from '../../types/NFTSelection';
import computeHash from '../../util/computeHash';
import download from '../../util/download';
import { stripHexPrefix } from '../../util/utils';
import NFTBurnDialog from './NFTBurnDialog';
import NFTContextualActionsEventEmitter from './NFTContextualActionsEventEmitter';
import NFTMoveToProfileDialog from './NFTMoveToProfileDialog';
import { NFTTransferDialog, NFTTransferResult } from './NFTTransferAction';

/* ========================================================================== */
/*                          Common Action Types/Enums                         */
/* ========================================================================== */

export enum NFTContextualActionTypes {
  None = 0,
  CreateOffer = 1,
  Transfer = 2,
  MoveToProfile = 4,
  CancelUnconfirmedTransaction = 8,
  Hide = 16,
  Invalidate = 32,
  Burn = 64,
  CopyNFTId = 128,
  CopyURL = 256,
  ViewOnExplorer = 512,
  OpenInBrowser = 1024,
  Download = 2048,

  All = CreateOffer |
    Transfer |
    MoveToProfile |
    CancelUnconfirmedTransaction |
    CopyNFTId |
    CopyURL |
    ViewOnExplorer |
    OpenInBrowser |
    Download |
    Hide |
    Burn |
    Invalidate,
}

type NFTContextualActionProps = {
  selection?: NFTSelection;
};

/* ========================================================================== */
/*                             Copy NFT ID Action                             */
/* ========================================================================== */

type NFTCopyNFTIdContextualActionProps = NFTContextualActionProps;

function NFTCopyNFTIdContextualAction(props: NFTCopyNFTIdContextualActionProps) {
  const { selection } = props;
  const [, copyToClipboard] = useCopyToClipboard();
  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = (selection?.items.length ?? 0) !== 1;

  function handleCopy() {
    if (!selectedNft) {
      throw new Error('No NFT selected');
    }

    copyToClipboard(selectedNft.$nftId);
  }

  return (
    <MenuItem onClick={handleCopy} disabled={disabled} close>
      <ListItemIcon>
        <NFTsSmallIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Copy NFT ID</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                             Create Offer Action                            */
/* ========================================================================== */

type NFTCreateOfferContextualActionProps = NFTContextualActionProps;

function NFTCreateOfferContextualAction(props: NFTCreateOfferContextualActionProps) {
  const { selection } = props;
  const navigate = useNavigate();
  const [, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);
  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = !selection?.items?.length || selectedNft?.pendingTransaction;

  if (!selectedNft) return null;

  function handleCreateOffer() {
    if (!selectedNft) {
      throw new Error('No NFT selected');
    }

    setSelectedNFTIds([]);

    navigate('/dashboard/offers/builder', {
      state: {
        nftId: selectedNft.$nftId,
        referrerPath: window.location.hash.split('#').slice(-1)[0],
        nftWalletId: selectedNft?.walletId,
        nftIds: selection?.items.map((item) => item.$nftId),
      },
    });
  }

  return (
    <MenuItem onClick={handleCreateOffer} disabled={disabled} close>
      <ListItemIcon>
        <OffersSmallIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Create Offer</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                             Transfer NFT Action                            */
/* ========================================================================== */

type NFTTransferContextualActionProps = NFTContextualActionProps;

function NFTTransferContextualAction(props: NFTTransferContextualActionProps) {
  const { selection } = props;
  const openDialog = useOpenDialog();

  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = (selection?.items.length ?? 0) !== 1 || selectedNft?.pendingTransaction;

  function handleComplete(result?: NFTTransferResult) {
    if (result) {
      if (result.success) {
        openDialog(
          <AlertDialog title={<Trans>NFT Transfer Pending</Trans>}>
            <Trans>The NFT transfer transaction has been successfully submitted to the blockchain.</Trans>
          </AlertDialog>
        );
      } else {
        const error = result.error || 'Unknown error';
        openDialog(
          <AlertDialog title={<Trans>NFT Transfer Failed</Trans>}>
            <Trans>The NFT transfer failed: {error}</Trans>
          </AlertDialog>
        );
      }
    }
  }

  function handleTransferNFT() {
    openDialog(<NFTTransferDialog nft={selectedNft} onComplete={handleComplete} />);
  }

  return (
    <MenuItem onClick={handleTransferNFT} disabled={disabled} close>
      <ListItemIcon>
        <TransferIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Transfer NFT</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                           Move to Profile Action                           */
/* ========================================================================== */

type NFTMoveToProfileContextualActionProps = NFTContextualActionProps;

function NFTMoveToProfileContextualAction(props: NFTMoveToProfileContextualActionProps) {
  const { selection } = props;
  const openDialog = useOpenDialog();

  const disabled = selection?.items.reduce((p, c) => p || c?.pendingTransaction || !c?.supportsDid, false);

  function handleTransferNFT() {
    openDialog(<NFTMoveToProfileDialog nfts={selection?.items || []} open />);
  }

  return (
    <MenuItem onClick={handleTransferNFT} disabled={disabled} close>
      <ListItemIcon>
        <PermIdentityIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Move to Profile</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                    Cancel Unconfirmed Transaction Action                   */
/* ========================================================================== */

type NFTCancelUnconfirmedTransactionContextualActionProps = NFTContextualActionProps;

function NFTCancelUnconfirmedTransactionContextualAction(props: NFTCancelUnconfirmedTransactionContextualActionProps) {
  const { selection } = props;
  const [setNFTStatus] = useSetNFTStatusMutation(); // Not really cancelling, just updating the status
  const openDialog = useOpenDialog();

  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = (selection?.items.length ?? 0) !== 1 || !selectedNft?.pendingTransaction;

  async function handleCancelUnconfirmedTransaction() {
    const { error, data: response } = await setNFTStatus({
      walletId: selectedNft?.walletId,
      nftLauncherId: stripHexPrefix(selectedNft?.launcherId),
      nftCoinId: stripHexPrefix(selectedNft?.nftCoinId ?? ''),
      inTransaction: false,
    });
    const success = response?.success ?? false;
    const errorMessage = error ?? undefined;

    if (success) {
      openDialog(
        <AlertDialog title={<Trans>NFT Status Updated</Trans>}>
          <Trans>
            The NFT status has been updated. If the transaction was successfully sent to the mempool, it may still
            complete.
          </Trans>
        </AlertDialog>
      );
    } else {
      const err = errorMessage || 'Unknown error';
      openDialog(
        <AlertDialog title={<Trans>NFT Status Update Failed</Trans>}>
          <Trans>The NFT status update failed: {err}</Trans>
        </AlertDialog>
      );
    }
  }

  return (
    <MenuItem onClick={handleCancelUnconfirmedTransaction} disabled={disabled} divider close>
      <ListItemIcon>
        <CancelIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Cancel Unconfirmed Transaction</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                       Open Data URL in Browser Action                      */
/* ========================================================================== */

type NFTOpenInBrowserContextualActionProps = NFTContextualActionProps;

function NFTOpenInBrowserContextualAction(props: NFTOpenInBrowserContextualActionProps) {
  const { selection } = props;
  const openUnsafeLink = useOpenUnsafeLink();
  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const haveDataUrl = selectedNft?.dataUris?.length && selectedNft?.dataUris[0];
  const dataUrl: string | undefined = haveDataUrl ? selectedNft.dataUris[0] : undefined;
  const isUrlValid = useMemo(() => {
    if (!dataUrl) {
      return false;
    }

    return isURL(dataUrl);
  }, [dataUrl]);
  const disabled = !haveDataUrl || !isUrlValid;

  function handleOpenInBrowser() {
    if (dataUrl) {
      openUnsafeLink(dataUrl);
    }
  }

  return (
    <MenuItem onClick={handleOpenInBrowser} disabled={disabled} close>
      <ListItemIcon>
        <LinkSmallIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Open in Browser</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                               Copy URL Action                              */
/* ========================================================================== */

type NFTCopyURLContextualActionProps = NFTContextualActionProps;

function NFTCopyURLContextualAction(props: NFTCopyURLContextualActionProps) {
  const { selection } = props;
  const [, copyToClipboard] = useCopyToClipboard();
  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const haveDataUrl = selectedNft?.dataUris?.length && selectedNft?.dataUris[0];
  const dataUrl: string | undefined = haveDataUrl ? selectedNft.dataUris[0] : undefined;
  const disabled = !haveDataUrl;

  function handleCopy() {
    if (dataUrl) {
      copyToClipboard(dataUrl);
    }
  }

  return (
    <MenuItem onClick={handleCopy} disabled={disabled} divider close>
      <ListItemIcon>
        <LinkIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Copy Media URL</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                          View on MintGarden Action                         */
/* ========================================================================== */

type NFTViewOnExplorerContextualActionProps = NFTContextualActionProps & {
  title?: string | JSX.Element;
  explorer?: NFTExplorer;
};

function NFTViewOnExplorerContextualAction(props: NFTViewOnExplorerContextualActionProps) {
  const { selection, title, explorer } = props;
  const viewOnExplorer = useViewNFTOnExplorer();
  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = !selectedNft;

  function handleView() {
    if (selectedNft) {
      viewOnExplorer(selectedNft, explorer!);
    }
  }

  return (
    <MenuItem onClick={handleView} disabled={disabled} close>
      <ListItemIcon>
        <LinkSmallIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        {title}
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                          Download file                                     */
/* ========================================================================== */

type NFTDownloadContextualActionProps = NFTContextualActionProps;

function NFTDownloadContextualAction(props: NFTDownloadContextualActionProps) {
  const { selection } = props;
  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = !selectedNft;
  const dataUrl = selectedNft?.dataUris?.[0];

  function handleDownload() {
    if (!selectedNft) {
      return;
    }

    const dataUrlLocal = selectedNft?.dataUris?.[0];
    if (dataUrlLocal) {
      download(dataUrlLocal);
    }
  }

  if (!dataUrl) {
    return null;
  }

  return (
    <MenuItem onClick={handleDownload} disabled={disabled} close>
      <ListItemIcon>
        <DownloadIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Download</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                          Hide / Show NFT(s)                                */
/* ========================================================================== */

type NFTHideContextualActionProps = NFTContextualActionProps & {
  selection?: NFTSelection;
  isMultiSelect?: boolean;
  showOrHide?: boolean;
};

function NFTHideContextualAction(props: NFTHideContextualActionProps) {
  const { selection, isMultiSelect, showOrHide } = props;
  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = !selectedNft;
  const dataUrl = selectedNft?.dataUris?.[0];
  const [isNFTHidden, setIsNFTHidden, , setHiddenMultiple] = useHiddenNFTs();
  const [, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);

  const isHidden = isMultiSelect && showOrHide ? true : isNFTHidden(selectedNft);

  function handleToggle() {
    if (!selectedNft) {
      return;
    }

    if (isMultiSelect) {
      setHiddenMultiple(selection?.items, !isHidden);
      setSelectedNFTIds([]);
    } else {
      setIsNFTHidden(selectedNft, !isHidden);
    }
  }

  if (!dataUrl) {
    return null;
  }

  return (
    <MenuItem onClick={handleToggle} disabled={disabled} close>
      <ListItemIcon>{isHidden ? <VisibilityIcon /> : <VisibilityOffIcon />}</ListItemIcon>
      <Typography variant="inherit" noWrap>
        {isHidden ? <Trans>Show</Trans> : <Trans>Hide</Trans>}
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                          Burn NFT                                     */
/* ========================================================================== */

type NFTBurnContextualActionProps = NFTContextualActionProps;

function NFTBurnContextualAction(props: NFTBurnContextualActionProps) {
  const { selection } = props;

  const openDialog = useOpenDialog();
  const burnAddress = useBurnAddress();

  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = !selectedNft || !burnAddress || selectedNft?.pendingTransaction;
  const dataUrl = selectedNft?.dataUris?.[0];

  async function handleBurn() {
    if (!selectedNft) {
      return;
    }

    await openDialog(<NFTBurnDialog nft={selectedNft} />);
  }

  if (!dataUrl) {
    return null;
  }

  return (
    <MenuItem onClick={handleBurn} disabled={disabled} divider close>
      <ListItemIcon>
        <DeleteForeverIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Burn</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                     Invalidate cache of a single NFT                       */
/* ========================================================================== */

type NFTInvalidateContextualActionProps = NFTContextualActionProps & {
  selection?: NFTSelection;
  isMultiSelect?: boolean;
};

function NFTInvalidateContextualAction(props: NFTInvalidateContextualActionProps) {
  const { selection, isMultiSelect } = props;

  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = !selectedNft || selectedNft?.pendingTransaction;
  const dataUrl = selectedNft?.dataUris?.[0];
  const [, setThumbCache] = useLocalStorage(`thumb-cache-${selectedNft?.$nftId}`, null);
  const [, setContentCache] = useLocalStorage(`content-cache-${selectedNft?.$nftId}`, null);
  // const [, setMetadataCache] = useLocalStorage(`metadata-cache-${selectedNft?.$nftId}`, {});
  const [, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);
  const lru = useNFTMetadataLRU();
  const { ipcRenderer } = window as any;
  async function handleInvalidate() {
    if (isMultiSelect) {
      selection?.items.forEach((nft) => {
        window.localStorage.removeItem(`thumb-cache-${nft?.$nftId}`);
        window.localStorage.removeItem(`content-cache-${nft?.$nftId}`);
        window.localStorage.removeItem(`metadata-cache-${nft?.$nftId}`);
        lru.delete(nft?.$nftId);
        ipcRenderer.invoke(
          'removeCachedFile',
          computeHash(`${nft?.$nftId}_${nft?.dataUris?.[0]}`, { encoding: 'utf-8' })
        );
        NFTContextualActionsEventEmitter.emit(`force-reload-metadata-${nft?.$nftId}`);
      });
      setSelectedNFTIds([]);
      return;
    }
    if (!selectedNft) {
      return;
    }

    lru.delete(selectedNft?.$nftId);
    setThumbCache({});
    setContentCache({});
    ipcRenderer.invoke('removeCachedFile', computeHash(`${selectedNft?.$nftId}_${dataUrl}`, { encoding: 'utf-8' }));
    window.localStorage.removeItem(`metadata-cache-${selectedNft?.$nftId}`);
    NFTContextualActionsEventEmitter.emit(`force-reload-metadata-${selectedNft?.$nftId}`);
  }

  if (!dataUrl) {
    return null;
  }

  return (
    <MenuItem
      onClick={() => {
        handleInvalidate();
      }}
      disabled={disabled}
      close
    >
      <ListItemIcon>
        <RefreshIcon />
      </ListItemIcon>
      <Typography variant="inherit" noWrap>
        <Trans>Refresh NFT data</Trans>
      </Typography>
    </MenuItem>
  );
}

/* ========================================================================== */
/*                             Contextual Actions                             */
/* ========================================================================== */

type NFTContextualActionsProps = {
  label?: ReactNode;
  selection?: NFTSelection;
  availableActions?: NFTContextualActionTypes;
  toggle?: ReactNode;
  isMultiSelect?: boolean;
  showOrHide?: boolean;
};

export default function NFTContextualActions(props: NFTContextualActionsProps) {
  const {
    label = <Trans>Actions</Trans>,
    selection,
    availableActions = NFTContextualActionTypes.CreateOffer | NFTContextualActionTypes.Transfer,
    isMultiSelect,
    showOrHide,
    ...rest
  } = props;

  const actions = useMemo(() => {
    const actionComponents = {
      [`${NFTContextualActionTypes.CopyNFTId}`]: {
        action: NFTCopyNFTIdContextualAction,
        props: {},
      },
      [`${NFTContextualActionTypes.CreateOffer}`]: {
        action: NFTCreateOfferContextualAction,
        props: { isMultiSelect },
      },
      [`${NFTContextualActionTypes.Transfer}`]: {
        action: NFTTransferContextualAction,
        props: { isMultiSelect },
      },
      [`${NFTContextualActionTypes.MoveToProfile}`]: {
        action: NFTMoveToProfileContextualAction,
        props: {},
      },
      [`${NFTContextualActionTypes.Invalidate}`]: {
        action: NFTInvalidateContextualAction,
        props: { isMultiSelect },
      },
      [`${NFTContextualActionTypes.CancelUnconfirmedTransaction}`]: {
        action: NFTCancelUnconfirmedTransactionContextualAction,
        props: {},
      },

      [`${NFTContextualActionTypes.Hide}`]: {
        action: NFTHideContextualAction,
        props: { isMultiSelect, showOrHide },
      },
      [`${NFTContextualActionTypes.Burn}`]: {
        action: NFTBurnContextualAction,
        props: { isMultiSelect },
      },

      [`${NFTContextualActionTypes.ViewOnExplorer}`]: [
        {
          action: NFTViewOnExplorerContextualAction,
          props: {
            title: <Trans>View on MintGarden</Trans>,
            explorer: NFTExplorer.MintGarden,
          },
        },
        {
          action: NFTViewOnExplorerContextualAction,
          props: {
            title: <Trans>View on Spacescan.io</Trans>,
            explorer: NFTExplorer.Spacescan,
          },
        },
      ],
      [`${NFTContextualActionTypes.OpenInBrowser}`]: {
        action: NFTOpenInBrowserContextualAction,
        props: {},
      },
      [`${NFTContextualActionTypes.CopyURL}`]: {
        action: NFTCopyURLContextualAction,
        props: {},
      },
      [`${NFTContextualActionTypes.Download}`]: {
        action: NFTDownloadContextualAction,
        props: {},
      },
    };

    return Object.keys(NFTContextualActionTypes)
      .map(Number)
      .filter(Number.isInteger)
      .filter((key) => Object.prototype.hasOwnProperty.call(actionComponents, key))
      .filter((key) => availableActions & key)
      .map((key: any) => actionComponents[key])
      .flat();
  }, [availableActions, isMultiSelect, showOrHide]);

  return (
    <DropdownActions label={label} variant="outlined" items={selection?.items} {...rest}>
      {actions.map(({ action: Action, props: actionProps }) => (
        <Action key={`${Action.name}`} selection={selection} {...actionProps} />
      ))}
    </DropdownActions>
  );
}
