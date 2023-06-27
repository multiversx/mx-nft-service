export class ApiToken {
  identifier: string;
  ticker: string;
  name: string;
  price: string;
  decimals: number;

  constructor(init?: Partial<ApiToken>) {
    Object.assign(this, init);
  }
}

export class DexToken {
  id: string;
  symbol: string;
  name: string;
  price: string;
  decimals: number;

  constructor(init?: Partial<DexToken>) {
    Object.assign(this, init);
  }
}
