import { useGetVCQuery, useGetProofsForRootQuery } from '@chia-network/api-react';
import { ArrowBackIosNew } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import VCCard from './VCCard';

export default function VCDetail() {
  const { vcId } = useParams();
  const { isLoading, data } = useGetVCQuery({ vcId: vcId as string });
  const { data: proofsData } = useGetProofsForRootQuery(data?.vc?.proofHash);
  const navigate = useNavigate();

  function renderBackButton() {
    return (
      <IconButton onClick={() => navigate('/dashboard/vc')} sx={{ backgroundColor: 'action.hover' }}>
        <ArrowBackIosNew />
      </IconButton>
    );
  }

  function renderVCCard() {
    if (isLoading || !data) return null;
    return <VCCard isDetail vcRecord={data} proofs={proofsData?.proofs} />;
  }
  return (
    <Box sx={{ padding: '25px' }}>
      <Box>{renderBackButton()}</Box>
      <Box sx={{ height: '100%', marginTop: '25px' }}>{renderVCCard()}</Box>
    </Box>
  );
}
