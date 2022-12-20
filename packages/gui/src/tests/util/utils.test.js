const utils = require('../../util/utils');

describe('utils', () => {
  describe('#hexToArray', () => {
    it('converts lowercase hex string to an array', () => {
      const result = utils.hexToArray('0xeeaa');

      expect(result).toEqual([238, 170]);
    });
    it('converts uppercase hex string to an array', () => {
      const result = utils.hexToArray('0xEEAA');

      expect(result).toEqual([238, 170]);
    });
  });
  describe('#arrToHex', () => {
    it('converts an array to a hex string', () => {
      const result = utils.arrToHex([238, 170]);

      expect(result).toBe('eeaa');
    });
  });
});
