import { EventResponse } from './event.response';

export interface SourceResponse {
  address: string;
  timestamp: string;
  events: EventResponse[];
}
