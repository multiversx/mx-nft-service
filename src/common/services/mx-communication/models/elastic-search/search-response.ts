import { ShardsResponse } from './shards-response';
import { HitResponse } from './hit-response';

export interface SearchResponse {
  took: number;
  timed_out: boolean;
  _shards: ShardsResponse;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: HitResponse[];
  };
}

export interface CountResponse {
  count: number;
  _shards: ShardsResponse;
}
