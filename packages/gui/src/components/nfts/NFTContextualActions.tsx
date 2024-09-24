/* eslint-disable no-bitwise -- enable bitwise operators for this file */

import type { NFTInfo } from '@chia-network/api';
import { useSetNFTStatusMutation, useLocalStorage } from '@chia-network/api-react';
import { AlertDialog, DropdownActions, MenuItem, useOpenDialog, isValidURL } from '@chia-network/core';
import {
  Burn as BurnIcon,
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
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ListItemIcon, Typography } from '@mui/material';
import React, { useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCopyToClipboard } from 'react-use';

import useBurnAddress from '../../hooks/useBurnAddress';
import useHiddenNFTs from '../../hooks/useHiddenNFTs';
import useNFTs from '../../hooks/useNFTs';
import useOpenUnsafeLink from '../../hooks/useOpenUnsafeLink';
import useViewNFTOnExplorer, { NFTExplorer } from '../../hooks/useViewNFTOnExplorer';
import NFTSelection from '../../types/NFTSelection';
import download from '../../util/download';
import removeHexPrefix from '../../util/removeHexPrefix';

import MultipleDownloadDialog from './MultipleDownloadDialog';
import NFTBurnDialog from './NFTBurnDialog';
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
  const disabled = !selection?.items?.length || selectedNft?.pendingTransaction || selection?.items?.length > 10;

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
  const [, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);

  const disabled = selection?.items.reduce((p, c) => p || c?.pendingTransaction, false);

  function handleComplete(result?: NFTTransferResult) {
    if (result) {
      if (!result.error) {
        setSelectedNFTIds([]);
        openDialog(
          <AlertDialog title={<Trans>NFT Transfer Pending</Trans>}>
            <Trans>The NFT transfer transaction has been successfully submitted to the blockchain.</Trans>
          </AlertDialog>,
        );
      } else {
        openDialog(
          <AlertDialog title={<Trans>NFT Transfer Failed</Trans>}>
            <Trans>The NFT transfer failed: {result.error}</Trans>
          </AlertDialog>,
        );
      }
    }
  }

  function handleTransferNFT() {
    openDialog(<NFTTransferDialog nfts={selection?.items || []} onComplete={handleComplete} />);
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
    try {
      await setNFTStatus({
        walletId: selectedNft?.walletId,
        nftCoinId: removeHexPrefix(selectedNft?.nftCoinId ?? ''),
        inTransaction: false,
      }).unwrap();

      openDialog(
        <AlertDialog title={<Trans>NFT Status Updated</Trans>}>
          <Trans>
            The NFT status has been updated. If the transaction was successfully sent to the mempool, it may still
            complete.
          </Trans>
        </AlertDialog>,
      );
    } catch (error) {
      const err = error?.message || 'Unknown error';
      openDialog(
        <AlertDialog title={<Trans>NFT Status Update Failed</Trans>}>
          <Trans>The NFT status update failed: {err}</Trans>
        </AlertDialog>,
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

    return isValidURL(dataUrl);
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
  const selectedNfts: NFTInfo | undefined = selection?.items;
  const disabled = !selectedNft;
  const dataUrl = selectedNft?.dataUris?.[0];
  const openDialog = useOpenDialog();
  const [, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);

  async function handleDownload() {
    const { ipcRenderer } = window as any;
    if (!selectedNft) {
      return;
    }

    if (selectedNfts.length > 1) {
      const folder = await ipcRenderer.invoke('selectMultipleDownloadFolder');
      if (folder?.canceled !== true) {
        const nfts = selectedNfts.map((nft: NFTInfo) => {
          let hash;
          try {
            const item = localStorage.getItem(`content-cache-${nft.$nftId}`) || '';
            const obj = JSON.parse(item);
            if (obj.valid && obj.binary) {
              hash = obj.binary;
            }
          } catch (e) {
            return nft;
          }
          return { ...nft, hash };
        });
        setSelectedNFTIds([]);
        ipcRenderer.invoke('startMultipleDownload', { folder: folder.filePaths[0], nfts });
        await openDialog(<MultipleDownloadDialog folder={folder.filePaths[0]} />);
      }
    } else {
      const dataUrlLocal = selectedNft?.dataUris?.[0];
      if (dataUrlLocal) {
        download(dataUrlLocal);
      }
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
  showOrHide?: number;
};

function NFTHideContextualAction(props: NFTHideContextualActionProps) {
  const { selection, isMultiSelect, showOrHide } = props;
  const selectedNft: NFTInfo | undefined = selection?.items[0];
  const disabled = !selectedNft;
  const dataUrl = selectedNft?.dataUris?.[0];
  const [isNFTHidden, setIsNFTHidden, , setHiddenMultiple] = useHiddenNFTs();
  const [, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);

  const isHidden = isMultiSelect && showOrHide === 1 ? true : isNFTHidden(selectedNft?.$nftId);

  function handleToggle() {
    if (!selectedNft) {
      return;
    }

    if (isMultiSelect) {
      setHiddenMultiple(
        selection?.items.map((nft: NFTInfo) => nft.$nftId),
        !isHidden,
      );
      setSelectedNFTIds([]);
    } else {
      setIsNFTHidden(selectedNft.$nftId, !isHidden);
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
  const disabled = selection?.items.reduce((p, c) => p || c?.pendingTransaction, false) || !burnAddress;

  async function handleBurn() {
    if (!selection?.items) {
      return;
    }
    await openDialog(<NFTBurnDialog nfts={selection?.items || []} />);
  }

  return (
    <MenuItem onClick={handleBurn} disabled={disabled} divider close>
      <ListItemIcon>
        <BurnIcon />
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

  const { invalidate } = useNFTs();
  async function handleInvalidate() {
    if (isMultiSelect) {
      if (selection?.items.length) {
        await Promise.all(selection.items.map((nft: NFTInfo) => invalidate(nft.$nftId)));
      }
    } else if (selection?.items.length) {
      const selectedNft = selection?.items[0];
      await invalidate(selectedNft.$nftId);
    }
  }

  return (
    <MenuItem
      onClick={() => {
        handleInvalidate();
      }}
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
  showOrHide?: number;
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
        key: NFTContextualActionTypes.CopyNFTId,
      },
      [`${NFTContextualActionTypes.CreateOffer}`]: {
        action: NFTCreateOfferContextualAction,
        props: { isMultiSelect },
        key: NFTContextualActionTypes.CreateOffer,
      },
      [`${NFTContextualActionTypes.Transfer}`]: {
        action: NFTTransferContextualAction,
        props: { isMultiSelect },
        key: NFTContextualActionTypes.Transfer,
      },
      [`${NFTContextualActionTypes.MoveToProfile}`]: {
        action: NFTMoveToProfileContextualAction,
        props: {},
        key: NFTContextualActionTypes.MoveToProfile,
      },
      [`${NFTContextualActionTypes.Invalidate}`]: {
        action: NFTInvalidateContextualAction,
        props: { isMultiSelect },
        key: NFTContextualActionTypes.Invalidate,
      },
      [`${NFTContextualActionTypes.CancelUnconfirmedTransaction}`]: {
        action: NFTCancelUnconfirmedTransactionContextualAction,
        props: {},
        key: NFTContextualActionTypes.CancelUnconfirmedTransaction,
      },

      [`${NFTContextualActionTypes.Hide}`]: {
        action: NFTHideContextualAction,
        props: { isMultiSelect, showOrHide },
        key: NFTContextualActionTypes.Hide,
      },
      [`${NFTContextualActionTypes.Burn}`]: {
        action: NFTBurnContextualAction,
        props: { isMultiSelect },
        key: NFTContextualActionTypes.Burn,
      },

      [`${NFTContextualActionTypes.ViewOnExplorer}`]: [
        {
          action: NFTViewOnExplorerContextualAction,
          props: {
            title: <Trans>View on MintGarden</Trans>,
            explorer: NFTExplorer.MintGarden,
          },
          key: 'view-on-mintgarden',
        },
        {
          action: NFTViewOnExplorerContextualAction,
          props: {
            title: <Trans>View on Spacescan.io</Trans>,
            explorer: NFTExplorer.Spacescan,
          },
          key: 'view-on-spacescan',
        },
      ],
      [`${NFTContextualActionTypes.OpenInBrowser}`]: {
        action: NFTOpenInBrowserContextualAction,
        props: {},
        key: NFTContextualActionTypes.OpenInBrowser,
      },
      [`${NFTContextualActionTypes.CopyURL}`]: {
        action: NFTCopyURLContextualAction,
        props: {},
        key: NFTContextualActionTypes.CopyURL,
      },
      [`${NFTContextualActionTypes.Download}`]: {
        action: NFTDownloadContextualAction,
        props: {},
        key: NFTContextualActionTypes.Download,
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
    <DropdownActions
      label={label}
      variant="outlined"
      items={selection?.items}
      menuSx={{ top: '-78px', left: '38px' }} /* menu shouldn't appear over ACTIONS button, but above! */
      {...rest}
    >
      {actions.map(({ action: Action, props: actionProps, key }) => (
        <Action key={key} selection={selection} {...actionProps} />
      ))}
    </DropdownActions>
  );
}
