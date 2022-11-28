import toBech32m, { fromBech32m, decodeBech32m } from './toBech32m';

describe('toBech32m', () => {
  describe('toBech32m', () => {
    it('should convert a hex string to a bech32m string', () => {
      const hexString = '0x6a656666697a6b65776c';
      const bech32mString = toBech32m(hexString, 'xch');

      expect(bech32mString).toBe('xch1dfjkvenf0f4k2amv2y5f9j');
    });
    it('should not require the hex string begin with 0x', () => {
      const hexString = '6a656666697a6b65776c';
      const bech32mString = toBech32m(hexString, 'xch');

      expect(bech32mString).toBe('xch1dfjkvenf0f4k2amv2y5f9j');
    });
    it('should check if the input begins with the prefix', () => {
      const hexString = 'xch1dfjkvenf0f4k2amv2y5f9j';
      const bech32mString = toBech32m(hexString, 'xch');

      expect(bech32mString).toBe('xch1dfjkvenf0f4k2amv2y5f9j');
    });
    it('should encode a 0-length string', () => {
      const hexString = '';
      const bech32mString = toBech32m(hexString, 'xch');

      expect(bech32mString).toBe('xch1jlgazv');
    });
    it('should fail if non-hex characters are present', () => {
      const hexString = 'not a hex string';
      expect(() => toBech32m(hexString, 'xch')).toThrow();
    });
  });

  describe('fromBech32m', () => {
    it('should convert a bech32m string to a hex string', () => {
      const bech32mString = 'xch1dfjkvenf0f4k2amv2y5f9j';
      const hexString = fromBech32m(bech32mString);

      expect(hexString).toBe('6a656666697a6b65776c');
    });
    it('should throw if the bech32m string is invalid', () => {
      const bech32mString = 'not a valid bech32m string';
      expect(() => fromBech32m(bech32mString)).toThrow();
    });
  });

  describe('decodeBech32m', () => {
    it('should return the prefix and data as a string', () => {
      const bech32mString = 'xch1dfjkvenf0f4k2amv2y5f9j';
      const { prefix, data } = decodeBech32m(bech32mString);

      expect(prefix).toBe('xch');
      expect(data).toBe('jeffizkewl');
    });
    it('should return the prefix and data as a hex string', () => {
      const bech32mString = 'xch1dfjkvenf0f4k2amv2y5f9j';
      const { prefix, data } = decodeBech32m(bech32mString, 'hex');

      expect(prefix).toBe('xch');
      expect(data).toBe('6a656666697a6b65776c');
    });
    it('should throw if the bech32m string is invalid', () => {
      const bech32mString = 'not a valid bech32m string';
      expect(() => decodeBech32m(bech32mString)).toThrow();
    });
  });
});
