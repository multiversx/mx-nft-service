export class Token {
  id: string;
  symbol: string;
  name: string;
  price: string;
  decimals?: number;

  constructor(init?: Partial<Token>) {
    Object.assign(this, init);
  }
}
