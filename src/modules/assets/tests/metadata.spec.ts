import { Metadata } from '../models';

describe('Metadata', () => {
  describe('getInteractiveUrl', () => {
    it('should return null when input null', async () => {
      const results = Metadata.getInteractiveUrl(null);
      expect(results).toBeNull();
    });

    it('should return correct url when input is pinata url', async () => {
      const expectedUrl = 'https://maiar.mypinata.cloud/ipfs/QmXp1LVtVgykpXLzDmjgcwU9LVSK7myCo2L7uES3FoDuXF';
      const results = Metadata.getInteractiveUrl(expectedUrl);
      expect(results).toMatch(expectedUrl);
    });

    it('should return correct url when input is dweb url', async () => {
      const expectedUrl = 'https://dweb.link/ipfs/bafybeibpwalstivjttkvfutf2xr7i2yt6nxf2gsrppknnvhnqxh24xlvce';
      const results = Metadata.getInteractiveUrl(expectedUrl);
      expect(results).toMatch(expectedUrl);
    });

    it('should return correct url when input is ipfs url', async () => {
      const expectedUrl = 'https://ipfs.io/ipfs/bafybeibpwalstivjttkvfutf2xr7i2yt6nxf2gsrppknnvhnqxh24xlvce';
      const results = Metadata.getInteractiveUrl(expectedUrl);
      expect(results).toMatch(expectedUrl);
    });

    it('should return null url when input is not whitelisted', async () => {
      const expectedUrl = 'https://exo-cdn.s3.amazonaws.com/collectible?type=ticket';
      const results = Metadata.getInteractiveUrl(expectedUrl);
      expect(results).toBeNull();
    });
  });
});
