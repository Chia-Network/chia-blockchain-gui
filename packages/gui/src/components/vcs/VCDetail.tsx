import {
  useGetVCQuery,
  useGetProofsForRootQuery,
  useLocalStorage,
  useGetLoggedInFingerprintQuery,
} from '@chia-network/api-react';
import { ArrowBackIosNew } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import VCCard from './VCCard';

export default function VCDetail() {
  const { vcId } = useParams();
  const { isLoading, data } = useGetVCQuery({ vcId: vcId as string });
  const { data: proofsData } = useGetProofsForRootQuery(
    { root: (data as any)?.vc?.proofHash },
    { skip: isLoading || !data }
  );
  const [VCsLocalStorage] = useLocalStorage<any>('verifiable-credentials-local', {});

  const navigate = useNavigate();
  const { data: fingerprint } = useGetLoggedInFingerprintQuery();
  const localData =
    fingerprint && VCsLocalStorage[fingerprint]
      ? VCsLocalStorage[fingerprint].find((vc: any) => vc.sha256 === vcId)
      : null;

  function renderBackButton() {
    return (
      <IconButton onClick={() => navigate('/dashboard/vc')} sx={{ backgroundColor: 'action.hover' }}>
        <ArrowBackIosNew />
      </IconButton>
    );
  }

  function renderVCCard() {
    let proofs = proofsData?.proofs && Object.keys(proofsData?.proofs).length > 0 ? proofsData?.proofs : {};
    if (Object.keys(proofs).length === 0 && localData && localData.proof?.values) {
      proofs = localData.proof?.values;
    }
    if (isLoading || (!data && !localData)) return null;
    return <VCCard isDetail vcRecord={data || localData} proofs={proofs} isLocal={!!localData} />;
  }
  return (
    <Box sx={{ padding: '25px' }}>
      <Box>{renderBackButton()}</Box>
      <Box sx={{ height: '100%', marginTop: '25px' }}>{renderVCCard()}</Box>
    </Box>
  );
}
