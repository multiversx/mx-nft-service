export class DeleteCacheKeysInput {
  keys: string[];
  redisClientName?: string;
  localOnly?: boolean;

  constructor(init?: Partial<DeleteCacheKeysInput>) {
    Object.assign(this, init);
  }
}
