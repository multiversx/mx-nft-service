import { NftTypeEnum } from './models/NftTypes.enum';

export class AssetsQuery {
  private query: string = '';

  addCreator(creator: string): this {
    if (!creator) return this;
    if (this.query === '') this.query = `?creator=${creator}`;
    else this.query = `${this.query}&creator=${creator}`;
    return this;
  }

  addTags(tags: string[]): this {
    if (!tags) return this;
    if (this.query === '') this.query = `?tags=${tags}`;
    else this.query = `${this.query}&tags=${tags}`;
    return this;
  }

  addCollection(collection: string): this {
    if (!collection) return this;
    if (this.query === '') this.query = `?collection=${collection}`;
    else this.query = `${this.query}&collection=${collection}`;
    return this;
  }

  addType(type: NftTypeEnum): this {
    if (!type) return this;
    if (this.query === '') this.query = `?type=${type}`;
    else this.query = `${this.query}&type=${type}`;
    return this;
  }

  addPageSize(from: number, size: number): this {
    if (!from || !size) return this;
    if (this.query === '') this.query = `?from=${from}&size=${size}`;
    else this.query = `${this.query}&from=${from}&size=${size}`;
    return this;
  }

  build(): string {
    return this.query
      ? this.query + '&hasUris=true&withOwner=true&withSupply=true'
      : '?hasUris=true&withOwner=true&withSupply=true';
  }
}
