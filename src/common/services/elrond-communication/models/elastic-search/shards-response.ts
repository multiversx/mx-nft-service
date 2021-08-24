export interface ShardsResponse {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
  failures: any[];
}
