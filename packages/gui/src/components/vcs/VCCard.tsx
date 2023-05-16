import {
  useGetTimestampForHeightQuery,
  // useAddVCProofsMutation,
  // useSpendVCMutation,
  // useGetDIDsQuery,
  // useGetDIDCurrentCoinInfoQuery,
} from '@chia-network/api-react';
import { Truncate, Button } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Card, Typography, Table, TableRow, TableCell } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import moment from 'moment';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { didToDIDId } from '../../util/dids';

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
  // const { data: dids } = useGetDIDsQuery();
  // const didObject = dids ? dids.find((did) => did.type === 8) : null;
  // const { data: didInfo } = useGetDIDCurrentCoinInfoQuery({ walletId: didObject?.id || 0 });
  const { vcRecord, isDetail, proofs } = props;
  const { data: mintedTimestamp, isLoading: isLoadingMintHeight } = useGetTimestampForHeightQuery({
    height: vcRecord.confirmedAtHeight,
  });
  const navigate = useNavigate();
  // const [addVCProofs] = useAddVCProofsMutation();
  // const [spendVC] = useSpendVCMutation();
  const theme: any = useTheme();

  function renderProofs() {
    if (isDetail && proofs && Object.keys(proofs).length > 0) {
      const proofsRows = Object.keys(proofs).map((key) => (
        <TableRow key={key} sx={{ background: 'rgba(255, 255, 255, 0.3)' }}>
          <TableCell sx={{ border: '1px solid rgba(255, 255, 255, 0.5)' }}>{key}</TableCell>
          <TableCell sx={{ border: '1px solid rgba(255, 255, 255, 0.5)' }}>{proofs[key]}</TableCell>
        </TableRow>
      ));
      return <Table sx={{ width: 'inherit', marginTop: '5px' }}>{proofsRows}</Table>;
    }
    return isDetail && (!proofs || Object.keys(proofs).length === 0) ? <Trans>No</Trans> : <Trans>Yes</Trans>;
  }

  function renderProperties() {
    return (
      <>
        <RenderProperty
          label={
            <Typography sx={{ fontSize: '12px' }}>
              <Trans>Coin ID</Trans>
            </Typography>
          }
        >
          <Truncate tooltip copyToClipboard>
            {vcRecord.vc.launcherId}
          </Truncate>
        </RenderProperty>
        <RenderProperty label={<Trans>Issued</Trans>}>
          {!isLoadingMintHeight && mintedTimestamp ? moment(mintedTimestamp.timestamp * 1000).format('LLL') : null}
        </RenderProperty>
        {vcRecord.vc.proofProvider && (
          <RenderProperty label={<Trans>Issuer DID</Trans>}>
            <Truncate>{didToDIDId(vcRecord.vc.proofProvider)}</Truncate>
          </RenderProperty>
        )}
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

  // async function chooseFileLocal() {
  //   const fileContent = await (window as any).ipcRenderer.invoke('addProofsFromLocalFile');
  //   let json;
  //   try {
  //     json = JSON.parse(fileContent);
  //   } catch (e) {
  //     console.log('Error parsing json', e);
  //   }
  //   if (json) {
  //     const rootHash = await (window as any).ipcRenderer.invoke('calculateRootHash', json);
  //     const proofsResult = await addVCProofs(json);
  //     if (proofsResult.data?.success) {
  //       console.log('Spend result..........', spendResult);
  //     } else {
  //       console.log('ERROR..........', proofsResult);
  //     }
  //   }
  // }

  // function renderAddProofButton() {
  //   if (!isDetail) return null;
  //   return (
  //     <Button variant="outlined" sx={{ width: '100%' }} onClick={() => chooseFileLocal()}>
  //       <Trans>Add Proofs</Trans>
  //     </Button>
  //   );
  // }

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
      <Box
        sx={{
          background: theme.palette.colors.default.main,
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
