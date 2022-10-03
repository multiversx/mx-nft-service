export class TraitType {
  name: string;
  values: string[];

  constructor(init?: Partial<TraitType>) {
    Object.assign(this, init);
  }
}

export class CollectionTraits {
  identifier: string;
  traits: TraitType[];

  constructor(init?: Partial<CollectionTraits>) {
    Object.assign(this, init);
  }
}
