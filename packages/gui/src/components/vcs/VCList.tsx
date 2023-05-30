import { useGetVCListQuery /* useGetLoggedInFingerprintQuery */ } from '@chia-network/api-react';
import { Box } from '@mui/material';
import { styled } from '@mui/styles';
import React, { useCallback, useRef } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

import useVCCoinEvents from '../../hooks/useVCCoinEvents';
import VCCard from './VCCard';

function ItemContainer(props: { children?: React.ReactNode }) {
  const { children } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 2,
        alignContent: 'stretch',
        width: {
          xs: '100%',
          sm: '50%',
          lg: '33.333333%',
          xl: '25%',
        },
      }}
    >
      {children}
    </Box>
  );
}

const ListContainer = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  paddingLeft: 0,
  paddingRight: 0,
});

export default function VCList() {
  const { isLoading, data } = useGetVCListQuery({});
  // console.log('Data........', data);
  const scrollerRef = useRef<HTMLElement>(null);

  const handleScrollRef = useCallback(
    (ref: HTMLElement | null) => {
      scrollerRef.current = ref;
    },
    [scrollerRef]
  );

  const [forceUpdate, setForceUpdate] = React.useState(false);

  // const { data: fingerprint } = useGetLoggedInFingerprintQuery();
  // console.log('Fingerprint........', fingerprint);

  const subscribeToVCCoinChanges = useVCCoinEvents();

  React.useEffect(() => {
    const unsubscribe = subscribeToVCCoinChanges((changed) => {
      if (changed) {
        // console.log('Query List.........', data);
        // console.log('Changed data.........', changed);
      }
      setForceUpdate(!forceUpdate);
    });
    return () => unsubscribe();
  }, [subscribeToVCCoinChanges, forceUpdate]);

  const COMPONENTS = {
    Item: ItemContainer,
    List: ListContainer,
  };

  function renderVCCard(index: number, vcRecord: any) {
    return <VCCard vcRecord={vcRecord} />;
  }

  if (isLoading) return null;

  const vcRecordsSortLatest = data?.vcRecords
    ? Array.from(data?.vcRecords).sort((a, b) => (b.confirmedAtHeight > a.confirmedAtHeight ? 1 : -1))
    : [];

  return (
    <Box sx={{ height: '100%', padding: '25px' }}>
      <VirtuosoGrid
        style={{ height: '100%' }}
        data={vcRecordsSortLatest}
        components={COMPONENTS}
        itemContent={renderVCCard}
        scrollerRef={handleScrollRef}
      />
    </Box>
  );
}
