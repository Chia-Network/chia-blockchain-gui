import { useGetTimestampForHeightQuery, useRevokeVCMutation, usePrefs } from '@chia-network/api-react';
import { Truncate, Button, useOpenDialog, AlertDialog, Flex, More, MenuItem } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Box, Card, Typography, Table, TableRow, TableCell, ListItemIcon, IconButton } from '@mui/material';
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

export default function VCCard(props: { vcRecord: any; isDetail?: boolean; proofs?: any }) {
  const { vcRecord, isDetail, proofs } = props;
  const { data: mintedTimestamp, isLoading: isLoadingMintHeight } = useGetTimestampForHeightQuery({
    height: vcRecord.confirmedAtHeight,
  });
  const navigate = useNavigate();
  const [revokeVC] = useRevokeVCMutation();
  const theme: any = useTheme();
  const openDialog = useOpenDialog();
  const [vcTitlesObject] = usePrefs<any>('verifiable-credentials-titles', {});
  const vcTitle = React.useMemo(
    () => vcTitlesObject[vcRecord.vc.launcherId] || <Trans>Verifiable Credential</Trans>,
    [vcRecord.vc.launcherId, vcTitlesObject]
  );
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);

  function renderProofs() {
    if (isDetail && proofs && Object.keys(proofs).length > 0) {
      const proofsRows = Object.keys(proofs).map((key) => (
        <TableRow key={key} sx={{ background: 'rgba(255, 255, 255, 0.3)' }}>
          <TableCell sx={{ border: '1px solid rgba(255, 255, 255, 0.5)' }}>{key}</TableCell>
          <TableCell sx={{ border: '1px solid rgba(255, 255, 255, 0.5)' }}>{proofs[key]}</TableCell>
        </TableRow>
      ));
      return <Table sx={{ width: 'inherit', margin: '5px 0 25px 0' }}>{proofsRows}</Table>;
    }
    return isDetail && (!proofs || Object.keys(proofs).length === 0) ? <Trans>No</Trans> : <Trans>Yes</Trans>;
  }

  function renderProperties() {
    return (
      <>
        {vcRecord.vc.proofProvider && (
          <RenderProperty label={<Trans>Issuer DID</Trans>}>
            {isDetail ? (
              didToDIDId(vcRecord.vc.proofProvider)
            ) : (
              <Truncate tooltip copyToClipboard>
                {didToDIDId(vcRecord.vc.proofProvider)}
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
            vcRecord.vc.launcherId
          ) : (
            <Truncate tooltip copyToClipboard>
              {vcRecord.vc.launcherId}
            </Truncate>
          )}
        </RenderProperty>
        <RenderProperty label={<Trans>Issued</Trans>}>
          {!isLoadingMintHeight && mintedTimestamp ? moment(mintedTimestamp.timestamp * 1000).format('LLL') : null}
        </RenderProperty>
        <RenderProperty label={<Trans>Proofs</Trans>}>
          {vcRecord.vc.proofHash ? renderProofs() : <Trans>No</Trans>}
        </RenderProperty>
      </>
    );
  }

  function renderViewDetailButton() {
    if (isDetail) return null;

    return (
      <Button variant="outlined" sx={{ width: '100%' }}>
        <Trans>View Credential Data</Trans>
      </Button>
    );
  }

  async function openRevokeVCDialog() {
    const confirmedWithFee = await openDialog(<VCRevokeDialog vcTitle={vcTitle} />);
    if (confirmedWithFee >= 0) {
      const revokedResponse = await revokeVC({
        vcParentId: vcRecord.vc.coin.parentCoinInfo,
        fee: parseFloat(confirmedWithFee),
      });
      if (revokedResponse.data?.success) {
        await openDialog(
          <AlertDialog title={<Trans>Verifiable Credential Revoked</Trans>}>
            <Trans>Transaction sent to blockchain successfully.</Trans>
          </AlertDialog>
        );
        navigate('/dashboard/vc');
      } else if ((revokedResponse as any).error) {
        openDialog(
          <AlertDialog title={<Trans>Error</Trans>}>
            {(revokedResponse as any).error ? <Box>{(revokedResponse as any).error?.data?.error}</Box> : null}
          </AlertDialog>
        );
      }
    }
  }

  function renderActionsDropdown() {
    if (!isDetail) return null;
    return (
      <Flex sx={{ marginBottom: '10px', padding: '8px' }}>
        <More>
          <MenuItem onClick={openRevokeVCDialog} close>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              <Trans>Revoke Verifiable Credential</Trans>
            </Typography>
          </MenuItem>
        </More>
      </Flex>
    );
  }

  function renderTitle() {
    if (isEditingTitle) {
      return (
        <Box sx={{ marginBottom: '10px' }}>
          <VCEditTitle
            vcId={vcRecord.vc.launcherId}
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
            <EditIcon color="disabled" />
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
        navigate(`/dashboard/vc/${vcRecord.vc.launcherId}`);
      }}
    >
      <Flex flexDirection="row" justifyContent="space-between">
        {renderTitle()}
        {renderActionsDropdown()}
      </Flex>
      <Box
        sx={{
          background: theme.palette.colors.default.background,
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
