export class TraitTypeValues {
  name: string;
  values: string[];

  constructor(init?: Partial<TraitTypeValues>) {
    this.values = [];
    Object.assign(this, init);
  }
}

export class CollectionTraits {
  identifier: string;
  traits: TraitTypeValues[];

  constructor(init?: Partial<CollectionTraits>) {
    Object.assign(this, init);
  }
}
