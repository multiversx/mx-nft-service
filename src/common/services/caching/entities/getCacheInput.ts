export class GetCacheKeysInput {
  keys: string[];
  redisClientName: string;

  constructor(init?: Partial<GetCacheKeysInput>) {
    Object.assign(this, init);
  }
}
