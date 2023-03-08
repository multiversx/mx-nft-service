export class GetCacheKeysInput {
  keys: string[];

  constructor(init?: Partial<GetCacheKeysInput>) {
    Object.assign(this, init);
  }
}
