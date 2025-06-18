import { OfferTradeRecord } from '@chia-network/api';
import { useGetOfferDataMutation } from '@chia-network/api-react';

import { suggestedFilenameForOffer } from '../components/offers/utils';

import useAssetIdName from './useAssetIdName';

export type SaveOfferFileHook = (tradeId: string) => Promise<void>;

export default function useSaveOfferFile(): [SaveOfferFileHook] {
  const [getOfferData] = useGetOfferDataMutation();
  const { lookupByAssetId } = useAssetIdName();

  async function saveOfferFile(tradeId: string): Promise<void> {
    const {
      data: response,
    }: {
      data: { offer: string; tradeRecord: OfferTradeRecord; success: boolean };
    } = await getOfferData({ offerId: tradeId });
    const { offer: offerData, tradeRecord, success } = response;
    if (success === true) {
      await window.appAPI.showSaveDialogAndSave({
        defaultPath: suggestedFilenameForOffer(tradeRecord.summary, lookupByAssetId),
        content: offerData,
      });
    }
  }

  return [saveOfferFile];
}
