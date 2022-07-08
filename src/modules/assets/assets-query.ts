import { NftTypeEnum } from './models/NftTypes.enum';

export class AssetsQuery {
  private query: string = '';

  private addParamToQuery(
    paramName: string,
    paramValue: string | string[] | number | boolean,
  ): this {
    if (!paramValue || !paramName) return this;
    this.query += `${
      this.query.length === 0 ? '?' : '&'
    }${paramName}=${paramValue}`;
    return this;
  }

  addQuery(query: string): this {
    if (!query || query?.length === 0) return this;
    if (query[0] === '&' || query[0] === '?') this.query += query;
    else if (this.query.length === 0) this.query += '?' + query;
    else this.query += '&' + query;
    return this;
  }

  addCreator(creator: string): this {
    return this.addParamToQuery('creator', creator);
  }

  addTags(tags: string[]): this {
    return this.addParamToQuery('tags', tags);
  }

  addIdentifiers(identifiers: string[]): this {
    return this.addParamToQuery('identifiers', identifiers);
  }

  addFields(fields: string[]): this {
    return this.addParamToQuery('fields', fields);
  }

  addCollection(collection: string): this {
    return this.addParamToQuery('collection', collection);
  }

  addType(type: NftTypeEnum): this {
    return this.addParamToQuery('type', type);
  }

  addSearchTerm(searchTerm: string): this {
    return this.addParamToQuery('searchTerm', encodeURIComponent(searchTerm));
  }

  addPageSize(from: number, size: number): this {
    return this.addParamToQuery('from', from).addParamToQuery('size', size);
  }

  withSupply(): this {
    return this.addParamToQuery('withSupply', true);
  }

  withOwner(): this {
    return this.addParamToQuery('withOwner', true);
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
