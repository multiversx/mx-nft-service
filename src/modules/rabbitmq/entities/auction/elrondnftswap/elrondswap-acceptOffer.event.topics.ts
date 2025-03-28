import { Address, BinaryCodec, FieldDefinition, StructType, TokenIdentifierType, U64Type } from '@multiversx/sdk-core';

export class ElrondSwapAcceptOfferTopics {
  private offerId: number;
  private collection: string;
  private nonce: string;
  private nrOfferTokens: string;
  private originalOwner: Address;
  private paymentAmount: string;
  private paymentToken: string;
  private paymentTokenNonce: string;

  constructor(rawTopics: string[]) {
    this.offerId = parseInt(Buffer.from(rawTopics[1], 'base64').toString('hex'), 16);
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.nrOfferTokens = parseInt(Buffer.from(rawTopics[4], 'base64').toString('hex'), 16).toString();
    this.originalOwner = new Address(Buffer.from(rawTopics[5], 'base64'));
    this.paymentAmount = Buffer.from(rawTopics[6], 'base64').toString('hex').hexBigNumberToString();
    let token = decodeToken(Buffer.from(rawTopics[7], 'base64'));
    this.paymentToken = token.token_type;
    this.paymentTokenNonce = token.nonce;
  }

  toPlainObject() {
    return {
      originalOwner: this.originalOwner.toBech32(),
      collection: this.collection,
      nonce: this.nonce,
      offerId: this.offerId,
      nrOfferTokens: this.nrOfferTokens,
      paymentAmount: this.paymentAmount,
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
