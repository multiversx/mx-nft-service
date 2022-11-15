export class CollectionFromElastic {
  ticker: string;
  hasRarities?: boolean;

  constructor(init?: Partial<CollectionFromElastic>) {
    Object.assign(this, init);
  }

  static fromElastic(collection: any): CollectionFromElastic {
    return new CollectionFromElastic({
      ticker: collection.token,
      hasRarities: collection.nft_hasRarities,
    });
  }
}
