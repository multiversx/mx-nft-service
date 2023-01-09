export interface SignedMxTransactionDTO {
  /**
   * Transactions nonce
   */
  nonce: number;
  /**
   * Transaction value in WEI
   */
  value: number;
  /**
   * Address for receiver
   */
  receiver: string;
  /**
   * Sender address
   */
  sender: string;
  /**
   * Gas price used
   */
  gasPrice: number;
  /**
   * Gas limit used
   */
  gasLimit: number;
  /**
   *
   */
  fee: string;
  /**
   * Gas limit used
   */
  gasUsed: number;
  /**
   * Transaction Data
   */
  data: string;
  /**
   * Transaction Signature
   */
  signature: string;
  /**
   * Network ID
   */
  chainID: string;
  /**
   * TBD
   */
  version: string;
}

/**
 * Transaction object from MultiversX chain.
 */
export interface MxTransactionDTO extends SignedMxTransactionDTO {
  /**
   * Transaction hash
   */
  hash: string;
  /**
   * TBD
   */
  miniBlockHash: string;
  /**
   * Block hash
   */
  blockHash: string;
  /**
   * TBD
   */
  round: number;
  /**
   * Shard of the receiver
   */
  receiverShard: number;
  /**
   * Shard of the sender
   */
  senderShard: number;
  /**
   * Transaction timestamp
   */
  timestamp: number;
  /**
   * Transaction Status.
   * TBD: define statuse.
   */
  status: string;
}
