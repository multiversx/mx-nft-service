import { QueryResponse } from '@elrondnetwork/erdjs/out/smartcontracts';
export declare class QueryResponseHelper {
    static handleQueryAmountResponse(response: QueryResponse): string;
    static getDataForCache(queryResponse: QueryResponse): {
        returnData: any[];
        returnCode: string;
        returnMessage: string;
        gasUsed: import("@elrondnetwork/erdjs/out").GasLimit;
    };
}
