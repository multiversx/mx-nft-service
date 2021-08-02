export function base64DecodeBinary(str: string): Buffer {
  return Buffer.from(str, 'base64');
}

export function base64Decode(str: string): string {
  return base64DecodeBinary(str).toString('binary');
}

export function getDataArgs(data): string[] | undefined {
  const decoded = this.getDataDecoded(data);
  if (decoded) {
    return decoded.split('@').splice(1);
  }

  return undefined;
}

export function getDataEndpointName(data): string | undefined {
  const decoded = this.getDataArgs(data);
  if (decoded && decoded.length > 2) {
    return Buffer.from(decoded[4], 'hex').toString();
  }
  return undefined;
}

export function getDataFunctionName(data): string | undefined {
  const decoded = this.getDataDecoded(data);
  if (decoded) {
    return decoded.split('@')[0];
  }

  return undefined;
}

export function getDataDecoded(data): string | undefined {
  if (data) {
    return base64Decode(data);
  }
  return undefined;
}
