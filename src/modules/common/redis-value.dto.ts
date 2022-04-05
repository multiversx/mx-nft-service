export class RedisValue {
  ttl: number;
  values: any;
  constructor(init?: Partial<RedisValue>) {
    Object.assign(this, init);
  }
}
