import { Address, BinaryCodec, FieldDefinition, StructType, TokenIdentifierType, U64Type } from '@multiversx/sdk-core';
import { NumberUtils } from '@multiversx/sdk-nestjs-common';

export class ElrondSwapAuctionTopics {
  private auctionId: string;
  private collection: string;
  private nonce: string;
  private nrAuctionTokens: string;
  private originalOwner: Address;
  private price: string;
  private paymentToken: string;
  private paymentTokenNonce: string;
  private auctionType: string;
  private deadline: number;

  constructor(rawTopics: string[]) {
    let token = decodeToken(Buffer.from(rawTopics[7], 'base64'));
    this.auctionId = Buffer.from(rawTopics[1], 'base64').toString('hex');
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.nrAuctionTokens = parseInt(Buffer.from(rawTopics[4], 'base64').toString('hex'), 16).toString();
    this.originalOwner = new Address(Buffer.from(rawTopics[5], 'base64'));
    this.price = Buffer.from(rawTopics[6], 'base64').toString('hex').hexBigNumberToString();
    this.paymentToken = token.token_type;
    this.paymentTokenNonce = token.nonce;
    this.auctionType = Buffer.from(rawTopics[8], 'base64').toString('hex');
    this.deadline = parseInt(NumberUtils.numberDecode(rawTopics[9] ?? '00'));
  }

  toPlainObject() {
    return {
      originalOwner: this.originalOwner.toBech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
      price: this.price,
      paymentToken: this.paymentToken,
      paymentTokenNonce: this.paymentTokenNonce,
      auctionType: this.auctionType,
      deadline: this.deadline,
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
