import { SourceResponse } from './source-response';

export interface HitResponse {
  _index: string;
  _type: string;
  _id: string;
  _score: string;
  _source: SourceResponse;
}
