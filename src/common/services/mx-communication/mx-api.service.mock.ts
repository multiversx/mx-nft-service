export class MxApiServiceMock {
  async getNftsForUserCount(_address: string, _query: string = ''): Promise<number> {
    return Promise.resolve(4);
  }

  async getNftsCountForCollection(_query: string = '', _collection: string = ''): Promise<{ value: string; key: string }> {
    return Promise.resolve({ key: 'identifier', value: '4' });
  }

  async getCollectionsForAddressCount(_address: string = '', _query: string = ''): Promise<number> {
    return Promise.resolve(2);
  }

  async getNftsCount(_query: string = ''): Promise<any> {
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

  async getTags(_from: number = 0, _size: number = 10): Promise<any> {
    return Promise.resolve([
      { tag: 'tag1', count: 12 },
      { tag: 'tag2', count: 10 },
    ]);
  }
  async getTagsCount(): Promise<any> {
    return Promise.resolve(2);
  }
}
