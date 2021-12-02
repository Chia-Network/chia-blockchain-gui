import type OfferSummary from './OfferSummary';

type OfferTradeRecord = {
  confirmed_at_index: number;
  accepted_at_time: number;
  created_at_time: number;
  is_my_offer: boolean;
  sent: number;
  coins_of_interest: any[];
  trade_id: string;
  status: string;
  sent_to: any[];
  summary: OfferSummary;
};

export default OfferTradeRecord;
