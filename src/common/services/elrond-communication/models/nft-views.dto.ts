export class NftViewsCount {
  identifier: string;
  viewsCount: number;
  constructor(init?: Partial<NftViewsCount>) {
    Object.assign(this, init);
  }
}
