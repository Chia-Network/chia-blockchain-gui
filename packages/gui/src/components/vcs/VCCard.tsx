import {
  useGetTimestampForHeightQuery,
  useRevokeVCMutation,
  useLocalStorage,
  useGetLoggedInFingerprintQuery,
  useGetTransactionAsyncMutation,
  usePrefs,
} from '@chia-network/api-react';
import { Truncate, Button, Color, useOpenDialog, AlertDialog, Flex, More, MenuItem } from '@chia-network/core';
import { Burn as BurnIcon } from '@chia-network/icons';
import { Trans, t } from '@lingui/macro';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { alpha, Box, Card, Typography, Table, TableRow, TableCell, ListItemIcon, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import moment from 'moment';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { didToDIDId } from '../../util/dids';
import VCEditTitle from './VCEditTitle';
import VCRevokeDialog from './VCRevokeDialog';

type RenderPropertyProps = {
  children?: JSX.Element | string | null;
  label: JSX.Element;
};

function RenderProperty(props: RenderPropertyProps) {
  const { label, children } = props;
  return (
    <Box>
      <Typography sx={{ fontSize: '12px' }}>{label}</Typography>
      <Box>{children}</Box>
    </Box>
  );
}

export default function VCCard(props: { vcRecord: any; isDetail?: boolean; proofs?: any; isLocal: boolean }) {
  const { vcRecord, isDetail, proofs, isLocal } = props;
  const { data: mintedTimestamp, isLoading: isLoadingMintHeight } = useGetTimestampForHeightQuery({
    height: vcRecord?.confirmedAtHeight || 0,
  });
  const navigate = useNavigate();
  const [revokeVC] = useRevokeVCMutation();
  const theme: any = useTheme();
  const openDialog = useOpenDialog();
  const [vcTitlesObject, setVcTitlesObject] = usePrefs<any>('verifiable-credentials-titles', {});
  const vcTitle = React.useMemo(
    () => vcTitlesObject[vcRecord?.vc?.launcherId] || vcTitlesObject[vcRecord?.sha256] || t`Verifiable Credential`,
    [vcRecord?.vc?.launcherId, vcRecord?.sha256, vcTitlesObject]
  );

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [VCsLocalStorage, setVCsLocalStorage] = useLocalStorage<any>('verifiable-credentials-local', {});
  const [pendingRevoke, setPendingRevoke] = useLocalStorage<any>('verifiable-credentials-pending-revoke', {});
  const { data: fingerprint } = useGetLoggedInFingerprintQuery();
  const [getTransactionAsync] = useGetTransactionAsyncMutation();
  React.useEffect(() => {
    if (vcRecord?.vc?.launcherId && pendingRevoke[vcRecord.vc.launcherId]) {
      getTransactionAsync({ transactionId: pendingRevoke[vcRecord.vc.launcherId] }).then((res) => {
        if (res.error) {
          const copyPendingRevoke = { ...pendingRevoke };
          delete copyPendingRevoke[vcRecord.vc.launcherId];
          setPendingRevoke(copyPendingRevoke);
        }
      });
    }
  }, [getTransactionAsync, pendingRevoke, vcRecord?.vc?.launcherId, setPendingRevoke]);

  if (!vcRecord) return null;

  function renderProofs() {
    if (isDetail && proofs && Object.keys(proofs).length > 0) {
      const proofsRows = Object.keys(proofs).map((key) => (
        <TableRow key={key} sx={{ background: alpha(Color.Neutral[50], 0.3) }}>
          <TableCell sx={{ border: `1px solid ${alpha(Color.Neutral[50], 0.5)}` }}>{key}</TableCell>
          <TableCell sx={{ border: `1px solid ${alpha(Color.Neutral[50], 0.5)}` }}>{proofs[key]}</TableCell>
        </TableRow>
      ));
      return <Table sx={{ width: 'inherit', margin: '5px 0 25px 0' }}>{proofsRows}</Table>;
    }
    return isDetail && (!proofs || Object.keys(proofs).length === 0) ? <Trans>No</Trans> : <Trans>Yes</Trans>;
  }

  function renderProperties() {
    let didString: string = vcRecord.credentialSubject?.id || '/';
    try {
      const proofProvider = vcRecord?.vc?.proofProvider;
      if (proofProvider) {
        didString = didToDIDId(proofProvider);
      }
    } catch (e) {
      /* ignore */
    }
    const issuanceDate =
      vcRecord.confirmedAtHeight && !isLoadingMintHeight && mintedTimestamp
        ? moment(mintedTimestamp.timestamp * 1000).format('LLL')
        : vcRecord.issuanceDate
        ? moment(vcRecord.issuanceDate).format('LLL')
        : '/';

    const expirationDate = vcRecord.expirationDate ? moment(vcRecord.expirationDate).format('LLL') : null;
    const vcType = Array.isArray(vcRecord.type) && vcRecord.type.indexOf('KYCCredential') > -1 ? 'KYCCredential' : null;

    return (
      <Box
        sx={{
          color: vcRecord?.vc?.launcherId && pendingRevoke[vcRecord.vc.launcherId] ? Color.Neutral[400] : 'inherit',
        }}
      >
        {didString && (
          <RenderProperty label={<Trans>Issuer DID</Trans>}>
            {isDetail ? (
              didString
            ) : (
              <Truncate tooltip copyToClipboard>
                {didString}
              </Truncate>
            )}
          </RenderProperty>
        )}
        <RenderProperty
          label={
            <Typography sx={{ fontSize: '12px' }}>
              <Trans>Coin ID</Trans>
            </Typography>
          }
        >
          {isDetail ? (
            vcRecord.vc?.launcherId || '/'
          ) : (
            <Truncate tooltip copyToClipboard>
              {vcRecord.vc?.launcherId || '/'}
            </Truncate>
          )}
        </RenderProperty>
        <RenderProperty label={<Trans>Issued</Trans>}>{issuanceDate}</RenderProperty>
        {isDetail && expirationDate && (
          <RenderProperty label={<Trans>Expiration</Trans>}>{expirationDate}</RenderProperty>
        )}
        {isDetail && vcType && <RenderProperty label={<Trans>Type</Trans>}>{vcType}</RenderProperty>}
        <RenderProperty label={<Trans>Status</Trans>}>
          {vcRecord.expirationDate && new Date(vcRecord.expirationDate).getTime() < new Date().getTime() ? (
            <Trans>Expired</Trans>
          ) : vcRecord.revoked ? (
            <Trans>Revoked</Trans>
          ) : vcRecord.isValid || !!(proofs && Object.keys(proofs).length > 0) ? (
            <Trans>Valid</Trans>
          ) : (
            <Trans>Invalid</Trans>
          )}
        </RenderProperty>
        {isDetail && isLocal && vcRecord.format && (
          <RenderProperty label={<Trans>Standard Version Number</Trans>}>{vcRecord.format}</RenderProperty>
        )}
        {isDetail && proofs && Object.keys(proofs).length > 0 && (
          <RenderProperty label={<Trans>Proofs</Trans>}>{renderProofs()}</RenderProperty>
        )}
      </Box>
    );
  }

  function renderViewDetailButton() {
    if (isDetail) return null;

    if (vcRecord?.vc?.launcherId && pendingRevoke[vcRecord.vc.launcherId]) {
      return (
        <Button variant="outlined" disabled sx={{ width: '100%' }}>
          <Trans>Pending removal</Trans>
        </Button>
      );
    }

    return (
      <Button variant="outlined" sx={{ width: '100%' }}>
        <Trans>View Credential Data</Trans>
      </Button>
    );
  }

  async function openRevokeVCDialog(type: string) {
    const confirmedWithFee = await openDialog(
      <VCRevokeDialog
        vcTitle={vcTitle}
        isLocal={isLocal}
        title={
          type === 'remove' ? <Trans>Remove Verifiable Credential</Trans> : <Trans>Revoke Verifiable Credential</Trans>
        }
        content={
          type === 'remove' ? (
            <Trans>Are you sure you want to remove</Trans>
          ) : (
            <Trans>Are you sure you want to revoke</Trans>
          )
        }
      />
    );
    let revokedResponse;
    let vcsLocalStorage;
    if (confirmedWithFee === -1) {
      if (fingerprint) {
        if (type === 'remove') {
          /* remove from local storage */
          vcsLocalStorage = { ...VCsLocalStorage };
          if (vcsLocalStorage[fingerprint]) {
            vcsLocalStorage[fingerprint] = vcsLocalStorage[fingerprint].filter(
              (x: any) => x.sha256 !== vcRecord.sha256
            );
          }
          if (vcsLocalStorage[fingerprint].length === 0) {
            delete vcsLocalStorage[fingerprint];
          }
          setVCsLocalStorage(vcsLocalStorage);
          /* remove title from prefs */
          const vcTitlesObjectCopy = { ...vcTitlesObject };
          delete vcTitlesObjectCopy[vcRecord.sha256];
          setVcTitlesObject(vcTitlesObjectCopy);
        }
        if (type === 'revoke') {
          /* add revoked flaglocal storage */
          vcsLocalStorage = { ...VCsLocalStorage };
          if (vcsLocalStorage[fingerprint]) {
            vcsLocalStorage[fingerprint] = vcsLocalStorage[fingerprint].map((x: any) =>
              x.sha256 === vcRecord.sha256 ? { ...x, revoked: true } : x
            );
          }
          setVCsLocalStorage(vcsLocalStorage);
        }
      }
    } else if (confirmedWithFee >= 0) {
      /* revoke onchain */
      revokedResponse = await revokeVC({
        vcParentId: vcRecord.vc?.coin.parentCoinInfo,
        fee: parseFloat(confirmedWithFee) * 1_000_000_000_000,
      });
    }

    if (revokedResponse?.data?.success) {
      if (Array.isArray(revokedResponse.data?.transactions) && revokedResponse.data?.transactions.length > 1) {
        setPendingRevoke({ ...pendingRevoke, [vcRecord.vc.launcherId]: revokedResponse.data.transactions[1].name });
      }
      await openDialog(
        <AlertDialog title={<Trans>Verifiable Credential Removed</Trans>}>
          <Trans>Transaction sent to blockchain successfully.</Trans>
        </AlertDialog>
      );
      navigate('/dashboard/vc');
    } else if (revokedResponse && (revokedResponse as any).error) {
      openDialog(
        <AlertDialog title={<Trans>Error</Trans>}>
          {(revokedResponse as any).error ? <Box>{(revokedResponse as any).error?.data?.error}</Box> : null}
        </AlertDialog>
      );
    } else if (confirmedWithFee === -1) {
      await openDialog(
        <AlertDialog title={<Trans>Success</Trans>}>
          {type === 'remove' ? (
            <Trans>Verifiable Credential Removed.</Trans>
          ) : (
            <Trans>Verifiable Credential Revoked.</Trans>
          )}
        </AlertDialog>
      );
      navigate('/dashboard/vc');
    }
  }

  function renderActionsDropdown() {
    if (!isDetail) return null;
    return (
      <Flex sx={{ marginBottom: '10px', padding: '8px' }}>
        <More>
          {isLocal && (
            <MenuItem onClick={() => openRevokeVCDialog('remove')} close>
              <ListItemIcon>
                <DeleteIcon color="info" />
              </ListItemIcon>
              <Typography variant="inherit" noWrap>
                <Trans>Remove Verifiable Credential</Trans>
              </Typography>
            </MenuItem>
          )}
          {!isLocal && (
            <MenuItem onClick={() => openRevokeVCDialog('revoke')} close>
              <ListItemIcon>
                <BurnIcon color="info" />
              </ListItemIcon>
              <Typography variant="inherit" noWrap>
                {isLocal ? <Trans>Delete Verifiable Credential</Trans> : <Trans>Revoke Verifiable Credential</Trans>}
              </Typography>
            </MenuItem>
          )}
        </More>
      </Flex>
    );
  }

  function renderTitle() {
    const isDark = theme.palette.mode === 'dark';
    if (isEditingTitle) {
      return (
        <Box sx={{ marginBottom: '10px' }}>
          <VCEditTitle
            vcId={vcRecord?.vc?.launcherId || vcRecord.sha256}
            onClose={() => {
              setIsEditingTitle(false);
            }}
          />
        </Box>
      );
    }
    return (
      <Flex flexDirection="row" sx={{ padding: '4px 12px 19px 14px' }}>
        <Flex sx={{ margin: '1px 5px 0 0' }}>
          <Typography variant="h6">{vcTitle}</Typography>
        </Flex>
        {isDetail && (
          <IconButton onClick={() => setIsEditingTitle(true)} size="small" sx={{ padding: '4px' }}>
            <EditIcon
              style={{
                color: isDark ? Color.Neutral[600] : Color.Neutral[400],
              }}
            />
          </IconButton>
        )}
      </Flex>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: '25px',
        borderRadius: '15px',
        border: `1px solid ${theme.palette.colors.default.border}`,
        width: '100%',
        cursor: 'pointer',
      }}
      onClick={() => {
        navigate(`/dashboard/vc/${vcRecord?.vc?.launcherId || vcRecord.sha256}`);
      }}
    >
      <Flex flexDirection="row" justifyContent="space-between">
        {renderTitle()}
        {renderActionsDropdown()}
      </Flex>
      <Box
        sx={{
          background: theme.palette.mode === 'dark' ? Color.Neutral[700] : Color.Neutral[200],
          borderRadius: '15px',
          padding: '25px',
          '> div': {
            marginBottom: '10px',
          },
        }}
      >
        {renderProperties()}
        {renderViewDetailButton()}
      </Box>
    </Card>
  );
}
