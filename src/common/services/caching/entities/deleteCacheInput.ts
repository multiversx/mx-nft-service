export class DeleteCacheKeysInput {
  keys: string[];

  constructor(init?: Partial<DeleteCacheKeysInput>) {
    Object.assign(this, init);
  }
}
