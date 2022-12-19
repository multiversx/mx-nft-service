import { EventResponse } from './event.response';

export interface SourceResponse {
  originalTxHash?: string;
  address: string;
  timestamp: number;
  events: EventResponse[];
}
