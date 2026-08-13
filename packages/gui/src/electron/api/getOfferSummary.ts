import { sendCommand } from './sendCommand';

type OfferSummaryResponse = Record<string, unknown> & {
  id?: string;
  success?: boolean;
  summary?: {
    additions: string[];
    fees: bigint;
    offered: Record<string, string>;
    requested: Record<string, string>;
    infos: Record<string, unknown>;
    removals: string[];
    valid_times: {
      max_height: number | null;
      max_time: number | null;
      min_height: number | null;
      min_time: number | null;
    };
  };
};

export async function getOfferSummary(offer: string) {
  return sendCommand<OfferSummaryResponse>('get_offer_summary', 'chia_wallet', {
    offer,
  });
}
