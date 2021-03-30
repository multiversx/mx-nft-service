import { HttpService } from './http.service';
import { SignedElrondTransactionDTO } from './models/interfaces/elrond/elrond-transaction.dto';
import { ElrondTransactionOutput } from './models/interfaces/elrond/elrond-transaction-output';
export declare class ElrondNodeService extends HttpService {
    config: any;
    constructor();
    sendTransaction(signedData: string | SignedElrondTransactionDTO): Promise<ElrondTransactionOutput>;
}
