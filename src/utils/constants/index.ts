export const redisURL = `redis://root:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL}:${process.env.REDIS_PORT}`;
export const nftIdentifierRgx = '^[A-Z][A-Z0-9]{2,9}-[a-f0-9]{6}-[a-f0-9]{2,}$';
export const nftIdentifierErrorMessage =
  'You should provide a valid nft identifier';
export const collectionIdentifierRgx = '^[A-Z][A-Z0-9]{2,9}-[a-f0-9]{6}$';
export const collectionIdentifierErrorMessage =
  'You should provide a valid collection identifier';
export const addressRgx = '^erd[a-z0-9]{59,59}$';
export const addressErrorMessage = 'You should provide a valid erd address';
