import { useGetTimestampForHeightQuery } from '@chia-network/api-react';
import React from 'react';

export default function VCGetTimestamp(props: {
  vcRecord: any;
  onVCTimestamp: (id: string, timestamp: number) => void;
}) {
  const { vcRecord, onVCTimestamp } = props;
  const { data: mintedTimestamp } = useGetTimestampForHeightQuery({
    height: vcRecord.confirmedAtHeight,
  });
  React.useEffect(() => {
    if (mintedTimestamp?.timestamp) {
      onVCTimestamp(vcRecord.vc?.launcherId, mintedTimestamp?.timestamp);
    }
  }, [mintedTimestamp, onVCTimestamp, vcRecord.vc?.launcherId]);
  return null;
}
