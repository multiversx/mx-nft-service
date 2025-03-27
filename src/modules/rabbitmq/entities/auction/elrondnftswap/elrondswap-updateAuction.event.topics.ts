import { Address, BinaryCodec, FieldDefinition, StructType, TokenIdentifierType, U64Type } from '@multiversx/sdk-core';
export class ElrondSwapUpdateTopics {
  private auctionId: string;
  private collection: string;
  private nonce: string;
  private nrAuctionTokens: number;
  private seller: Address;
  private price: string;
  private deadline: number;
  private paymentToken: string;
  private paymentTokenNonce: string;

  constructor(rawTopics: string[]) {
    this.auctionId = Buffer.from(rawTopics[1], 'base64').toString('hex');
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.nrAuctionTokens = parseInt(Buffer.from(rawTopics[4], 'base64').toString('hex'), 16);
    this.seller = new Address(Buffer.from(rawTopics[5], 'base64'));
    this.price = Buffer.from(rawTopics[6], 'base64').toString('hex').hexBigNumberToString();
    this.deadline = parseInt(Buffer.from(rawTopics[9], 'base64').toString('hex'), 16);
    let token = decodeToken(Buffer.from(rawTopics[7], 'base64'));
    this.paymentToken = token.token_type;
    this.paymentTokenNonce = token.nonce;
  }

  toPlainObject() {
    return {
      seller: this.seller.toBech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
      price: this.price,
      deadline: this.deadline,
      paymentToken: this.paymentToken,
      paymentTokenNonce: this.paymentTokenNonce,
    };
  }
}

function decodeToken(bufer: Buffer): any {
  const codec = new BinaryCodec();
  const type = new StructType('EsdtToken', [
    new FieldDefinition('token_type', '', new TokenIdentifierType()),
    new FieldDefinition('nonce', '', new U64Type()),
  ]);

  const [decoded] = codec.decodeNested(bufer, type);
  return decoded.valueOf();
}
