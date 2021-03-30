export interface SignedElrondTransactionDTO {
    nonce: number;
    value: number;
    receiver: string;
    sender: string;
    gasPrice: number;
    gasLimit: number;
    fee: string;
    gasUsed: number;
    data: string;
    signature: string;
    chainID: string;
    version: string;
}
export interface ElrondTransactionDTO extends SignedElrondTransactionDTO {
    hash: string;
    miniBlockHash: string;
    blockHash: string;
    round: number;
    receiverShard: number;
    senderShard: number;
    timestamp: number;
    status: string;
}
