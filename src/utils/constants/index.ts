export const REDIS_URL = `redis://root:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL}:${process.env.REDIS_PORT}`;
export const NFT_IDENTIFIER_RGX = '^[A-Z0-9]{3,10}-[a-f0-9]{6}-[a-f0-9]{2,}$';
export const NFT_IDENTIFIER_ERROR = 'You should provide a valid nft identifier';
export const COLLECTION_IDENTIFIER_RGX = '^[A-Z0-9]{3,10}-[a-f0-9]{6}$';
export const COLLECTION_IDENTIFIER_ERROR =
  'You should provide a valid collection identifier';
export const ADDRESS_RGX = '^erd[a-z0-9]{59,59}$';
export const ADDRESS_ERROR = 'You should provide a valid erd address';
export const NUMERIC_RGX = '^[0-9]*$';
export const NUMERIC_ERROR = 'should contain only numeric characters';

export const MYSQL_ALREADY_EXISTS = 1062;

export const XOXNO_KEY = 'xoxno';
export const DEADRARE_KEY = 'deadrare';
export const ELRONDNFTSWAP_KEY = 'elrondnftswap';
export const FRAMEIT_KEY = 'frameit';
