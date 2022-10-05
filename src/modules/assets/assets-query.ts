import { NftTrait } from '../nft-traits/models/nft-traits.model';
import { NftTypeEnum } from './models/NftTypes.enum';

export class AssetsQuery {
  private query: string = '';

  constructor(query: string = null) {
    if (!query) return this;
    return this.addQuery(query);
  }

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

  addCollections(collections: string[]): this {
    return this.addParamToQuery('collections', collections?.toString());
  }

  addType(type: NftTypeEnum): this {
    return this.addParamToQuery('type', type);
  }

  addSearchTerm(searchTerm: string): this {
    return this.addParamToQuery('search', encodeURIComponent(searchTerm));
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

  withNsfwFlag(): this {
    return this.addParamToQuery('isNsfw', false);
  }

  addBefore(timestamp: number): this {
    return this.addParamToQuery('before', timestamp);
  }

  addTraits(traits: NftTrait[]): this {
    if (!traits || traits?.length === 0) {
      return this;
    }

    let traitsQuery = '';
    for (let i = 0; i < traits.length; i++) {
      traitsQuery += `${traits[i].name}:${traits[i].value}`;
      traitsQuery += i < traits.length - 1 ? ';' : '';
    }
    return this.addParamToQuery('traits', traitsQuery);
  }

  build(addDefaultQuery: boolean = true): string {
    // TODO: handle whitelisting in a different way
    // const defaultQuery = 'hasUris=true&isWhitelistedStorage=true';
    const defaultQuery = 'hasUris=true';
    if (this.query.includes(defaultQuery) || !addDefaultQuery)
      return this.query;
    return this.addQuery(defaultQuery).build(false);
  }
}
