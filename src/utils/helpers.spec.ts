import { numberToFixedHexBuffer } from './helpers';

describe('Helpers test', () => {
  it('should return the correct hex buffer', () => {
    const hex = numberToFixedHexBuffer(582, 2);
    expect(hex).toMatchObject(Buffer.from('0246', 'hex'));
  });
});
