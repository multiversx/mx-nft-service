export class SetCacheKeyInput {
  key: string;
  ttl: number;
  value: any;

  constructor(init?: Partial<SetCacheKeyInput>) {
    Object.assign(this, init);
  }
}
