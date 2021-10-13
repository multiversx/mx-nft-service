import { NftTypeEnum } from './models/NftTypes.enum';

export class CollectionQuery {
  private query: string = '';

  addIssuer(issuer: string): this {
    if (!issuer) return this;
    if (this.query === '') this.query = `?issuer=${issuer}`;
    else this.query = `${this.query}&issuer=${issuer}`;
    return this;
  }

  addSearch(collectionName: string): this {
    if (!collectionName) return this;
    if (this.query === '') this.query = `?search=${collectionName}`;
    else this.query = `${this.query}&search=${collectionName}`;
    return this;
  }

  addType(type: NftTypeEnum): this {
    if (!type) return this;
    if (this.query === '') this.query = `?type=${type}`;
    else this.query = `${this.query}&type=${type}`;
    return this;
  }

  addCanCreate(canCreate: boolean): this {
    if (canCreate === undefined) return this;
    if (this.query === '') this.query = `?canCreate=${canCreate}`;
    else this.query = `${this.query}&canCreate=${canCreate}`;
    return this;
  }

  addPageSize(from: number, size: number): this {
    if (!from || !size) return this;
    if (this.query === '') this.query = `?from=${from}&size=${size}`;
    else this.query = `${this.query}&from=${from}&size=${size}`;
    return this;
  }

  build(): string {
    return this.query;
  }
}
