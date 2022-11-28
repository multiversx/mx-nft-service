export class CollectionWithTraitsFlag {
  identifier: string;
  hasTraitsFlagSet: boolean;

  constructor(init?: Partial<CollectionWithTraitsFlag>) {
    Object.assign(this, init);
  }
}
