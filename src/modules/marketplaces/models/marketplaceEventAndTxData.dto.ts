import { EventResponse } from 'src/common/services/mx-communication/models/elastic-search/event.response';

export interface MarketplaceEventAndTransactionData {
  eventData?: EventResponse;
  txData?: MarketplaceTransactionData;
}

export interface MarketplaceTransactionData {
  sender: string;
  receiver: string;
  value: string;
  blockHash: string;
  data?: string;
}
