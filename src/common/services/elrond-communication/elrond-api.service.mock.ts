export class ElrondApiServiceMock {
  async getNftsForUserCount(
    address: string,
    query: string = '',
  ): Promise<number> {
    return Promise.resolve(4);
  }

  async getNftsCountForCollection(
    query: string = '',
    collection: string = '',
  ): Promise<number> {
    return Promise.resolve(4);
  }

  async getCollectionsForAddressCount(
    address: string = '',
    query: string = '',
  ): Promise<number> {
    return Promise.resolve(2);
  }

  async getNftsCount(query: string = ''): Promise<any> {
    return Promise.resolve(10);
  }

  async getCollectionsBySearch(searchTerm: string = ''): Promise<any> {
    return Promise.resolve([{ collection: searchTerm }]);
  }

  async getNftsBySearch(searchTerm: string = ''): Promise<any> {
    return Promise.resolve([{ identifier: searchTerm }]);
  }

  async getTagsBySearch(searchTerm: string = ''): Promise<any> {
    return Promise.resolve([{ tag: searchTerm }]);
  }
}
