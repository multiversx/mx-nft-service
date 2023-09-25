import { NftTypeEnum } from '../assets/models/NftTypes.enum';

export class CollectionQuery {
  private query: string = '';

  addCreator(creator: string): this {
    if (!creator) return this;
    if (this.query === '') this.query = `?creator=${creator}`;
    else this.query = `${this.query}&creator=${creator}`;
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

  addSearchTerm(searchTerm: string): this {
    if (searchTerm === undefined) return this;
    if (this.query === '') this.query = `?search=${encodeURIComponent(searchTerm)}`;
    else this.query = `${this.query}&search=${encodeURIComponent(searchTerm)}`;
    return this;
  }

  addPageSize(from: number, size: number): this {
    if ((!from && from < 0) || !size) {
      return this;
    }
    if (this.query === '') {
      this.query = `?from=${from}&size=${size}`;
    } else {
      this.query = `${this.query}&from=${from}&size=${size}`;
    }
    return this;
  }

  build(): string {
    return this.query ? this.query + '&type=NonFungibleESDT,SemiFungibleESDT' : '?type=NonFungibleESDT,SemiFungibleESDT';
  }
}
