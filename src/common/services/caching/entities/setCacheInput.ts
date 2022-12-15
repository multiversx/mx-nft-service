export class SetCacheKeyInput {
  key: string;
  ttl: number;
  value: any;
  redisClientName: string;

  constructor(init?: Partial<SetCacheKeyInput>) {
    Object.assign(this, init);
  }
}
