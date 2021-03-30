declare global {
    interface String {
        base64ToHex(): string;
        base64ToBech32(): string;
        hexToBech32(): string;
        bech32ToHex(): string;
        hexBigNumberToString(): string;
        makeId(length: number): string;
        hexToNumber(): number;
        hexToAscii(): string;
    }
}
export {};
