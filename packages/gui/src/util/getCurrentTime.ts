import moment from 'moment';

export default function getCurrentTime(lastBlockTimeStampData: any) {
  const lastBlockTimeStamp = lastBlockTimeStampData?.timestamp || 0;
  const currentTimeMoment = moment.unix(lastBlockTimeStamp);
  // eslint-disable-next-line no-underscore-dangle -- description
  const currentTime = currentTimeMoment._i / 1000;

  return currentTime;
}
