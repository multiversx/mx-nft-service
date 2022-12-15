export class DeleteCacheKeysInput {
  keys: string[];
  redisClientName: string;

  constructor(init?: Partial<DeleteCacheKeysInput>) {
    Object.assign(this, init);
  }
}
