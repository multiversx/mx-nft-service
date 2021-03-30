import { ShardsResponse } from './shards-response';
import { HitResponse } from './hit-response';

export interface SearchResponse<T> {
  took: number;
  timed_out: boolean;
  _shards: ShardsResponse;
  hits: {
    total: number;
    max_score: number;
    hits: HitResponse<T>[];
  }
}

export interface CountResponse {
  count: number;
  _shards: ShardsResponse
}