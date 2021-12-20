import { EventResponse } from './event.response';

export interface SourceResponse {
  address: string;
  timestamp: number;
  events: EventResponse[];
}
