export class AttributeType {
  name: string;
  occurenceCount: number;
  occurencePercentage: number;

  constructor(init?: Partial<AttributeType>) {
    Object.assign(this, init);
  }
}

export class TraitType {
  name: string;
  attributes: AttributeType[];
  occurenceCount: number;
  occurencePercentage: number;

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
