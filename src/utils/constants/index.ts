export const REDIS_URL = `redis://root:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL}:${process.env.REDIS_PORT}`;
export const NFT_IDENTIFIER_RGX =
  '^[A-Z][A-Z0-9]{2,9}-[a-f0-9]{6}-[a-f0-9]{2,}$';
export const NFT_IDENTIFIER_ERROR = 'You should provide a valid nft identifier';
export const COLLECTION_IDENTIFIER_RGX = '^[A-Z][A-Z0-9]{2,9}-[a-f0-9]{6}$';
export const COLLECTION_IDENTIFIER_ERROR =
  'You should provide a valid collection identifier';
export const ADDRESS_RGX = '^erd[a-z0-9]{59,59}$';
export const ADDRESS_ERROR = 'You should provide a valid erd address';
