import { useGetAutoClaimQuery, useGetTimestampForHeightQuery, useGetHeightInfoQuery } from '@chia-network/api-react';
import { defineMessage } from '@lingui/macro';
import moment from 'moment';

import useTrans from './useTrans';

function getTextFromTransaction(
  transactionRow: any,
  t: any,
  lastBlockTimeStamp: number,
  isAutoClaimEnabled: any,
  isGetHeightInfoLoading: boolean,
  isGetTimestampForHeightLoading: boolean
) {
  let text = '';
  const canBeClaimedAt = moment((transactionRow?.timestamp || 0) * 1000);
  if (transactionRow?.timeLock) {
    canBeClaimedAt.add(transactionRow.timeLock, 'seconds');
  }
  const currentTime = moment.unix(lastBlockTimeStamp - 20); // extra 20 seconds so if the auto claim is enabled, it will not show to button to claim it
  const timeLeft = canBeClaimedAt.diff(currentTime, 'seconds');
  if (isGetHeightInfoLoading || isGetTimestampForHeightLoading || !lastBlockTimeStamp || transactionRow.claimed)
    return null;
  if (timeLeft > 0 && !transactionRow.passedTimeLock) {
    text = isAutoClaimEnabled
      ? t(
          defineMessage({
            message: 'Will be autoclaimed in ',
          })
        )
      : t(
          defineMessage({
            message: 'Can be claimed in ',
          })
        );
    text += canBeClaimedAt.from(currentTime, true); // ... 3 days
  } else if (transactionRow?.sent === 0) {
    text = t(
      defineMessage({
        message: 'Claim transaction',
      })
    );
  } else {
    text = t(
      defineMessage({
        message: 'Claiming...',
      })
    );
  }
  return text;
}

export default function useGetTextFromTransaction(notification: any) {
  const { data: height, isLoading: isGetHeightInfoLoading } = useGetHeightInfoQuery(undefined, {
    pollingInterval: 3000,
  });

  const { data: lastBlockTimeStampData, isLoading: isGetTimestampForHeightLoading } = useGetTimestampForHeightQuery({
    height: height || 0,
  });

  const { data: autoClaimData, isLoading: isGetAutoClaimLoading } = useGetAutoClaimQuery();
  const isAutoClaimEnabled = !isGetAutoClaimLoading && autoClaimData?.enabled;

  let lastBlockTimeStamp: number = 0;

  if (!isGetTimestampForHeightLoading) {
    lastBlockTimeStamp = lastBlockTimeStampData?.timestamp || 0;
  }

  const t = useTrans();

  return getTextFromTransaction(
    notification,
    t,
    lastBlockTimeStamp,
    isAutoClaimEnabled,
    isGetHeightInfoLoading,
    isGetTimestampForHeightLoading
  );
}
