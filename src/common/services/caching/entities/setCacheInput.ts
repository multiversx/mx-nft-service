export class SetCacheKeysInput {
  key: string;
  ttl: number;
  value: any;
  redisClientName: string;

  constructor(init?: Partial<SetCacheKeysInput>) {
    Object.assign(this, init);
  }
}
