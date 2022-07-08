import { NftTypeEnum } from './models/NftTypes.enum';

export class AssetsQuery {
  private query: string = '';

  addQuery(query: string): this {
    if (!query || query?.length === 0) return this;
    if (query[0] === '&' || query[0] === '?') this.query += query;
    else if (this.query.length === 0) this.query += '?' + query;
    else this.query += '&' + query;
    return this;
  }

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

  addIdentifiers(identifiers: string[]): this {
    if (!identifiers) return this;
    if (this.query === '') this.query = `?identifiers=${identifiers}`;
    else this.query = `${this.query}&identifiers=${identifiers}`;
    return this;
  }

  addFields(fields: string[]): this {
    if (!fields) return this;
    if (this.query === '') this.query = `?fields=${fields}`;
    else this.query = `${this.query}&fields=${fields}`;
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

  addSearchTerm(searchTerm: string): this {
    if (!searchTerm) return this;
    if (this.query === '')
      this.query = `?searchTerm=${encodeURIComponent(searchTerm)}`;
    else
      this.query = `${this.query}&searchTerm=${encodeURIComponent(searchTerm)}`;
    return this;
  }

  addPageSize(from: number, size: number): this {
    if (!from && !size) return this;
    if (this.query === '') this.query = `?from=${from}&size=${size}`;
    else this.query = `${this.query}&from=${from}&size=${size}`;
    return this;
  }

  withSupply(): this {
    if (this.query === '') this.query = `?withSupply=true`;
    else this.query = `${this.query}&withSupply=true`;
    return this;
  }

  withOwner(): this {
    if (this.query === '') this.query = `?withOwner=true`;
    else this.query = `${this.query}&withOwner=true`;
    return this;
  }

  build(addDefaultQuery: boolean = true): string {
    const defaultQuery = 'hasUris=true&isWhitelistedStorage=true&isNsfw=false';
    if (this.query.includes(defaultQuery) || !addDefaultQuery)
      return this.query;
    return this.query
      ? `${this.query}&${defaultQuery}`
      : `${this.query}?${defaultQuery}`;
  }
}
