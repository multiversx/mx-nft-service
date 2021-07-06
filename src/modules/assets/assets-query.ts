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
