import LRU, { DEFAULT_MAX_LRU_SIZE, lruCreate } from './lru';

describe('lru', () => {
  describe('#create', () => {
    it('should create an empty LRU', () => {
      const lru = new LRU<string, string>();
      expect(lru.size).toBe(0);
      expect(lru.capacity).toBe(DEFAULT_MAX_LRU_SIZE);
    });
    it('should support custom capacity', () => {
      const lru = new LRU<string, string>(10);
      expect(lru.size).toBe(0);
      expect(lru.capacity).toBe(10);
    });
  });
  describe('#set', () => {
    it('should set a value', () => {
      const lru = new LRU<string, string>();
      lru.set('foo', 'bar');
      expect(lru.size).toBe(1);
      expect(lru.get('foo')).toBe('bar');
    });
    it('should overwrite a value', () => {
      const lru = new LRU<string, string>();
      lru.set('foo', 'bar');
      lru.set('foo', 'baz');
      expect(lru.size).toBe(1);
      expect(lru.get('foo')).toBe('baz');
    });
    it('should delete the oldest entry when capacity is reached', () => {
      const lru = new LRU<string, string>(2);
      lru.set('a', '1');
      lru.set('b', '2');
      lru.set('c', '3');
      expect(lru.size).toBe(2);
      expect(lru.get('a')).toBeUndefined();
      expect(lru.get('b')).toBe('2');
      expect(lru.get('c')).toBe('3');
    });
  });
  describe('#get', () => {
    it('should get undefined for unknown keys', () => {
      const lru = new LRU<string, string>();
      expect(lru.get('foo')).toBeUndefined();
      lru.set('foo', 'bar');
      expect(lru.get('foo')).toBe('bar');
    });
  });
  describe('#delete', () => {
    it('should delete a value', () => {
      const lru = new LRU<string, string>();
      lru.set('foo', 'bar');
      expect(lru.get('foo')).toBe('bar');
      expect(lru.size).toBe(1);
      lru.delete('foo');
      expect(lru.size).toBe(0);
      expect(lru.get('foo')).toBeUndefined();
    });
  });
  describe('#size', () => {
    it('should return the number of entries', () => {
      const lru = new LRU<string, string>();
      expect(lru.size).toBe(0);
      lru.set('a', '1');
      expect(lru.size).toBe(1);
      lru.set('b', '2');
      expect(lru.size).toBe(2);
    });
  });
});

describe('lruCreate factory function', () => {
  it('should create an empty LRU', () => {
    const lru = lruCreate<string, string>();
    expect(lru.size).toBe(0);
    expect(lru.capacity).toBe(DEFAULT_MAX_LRU_SIZE);
  });
  it('should support custom capacity', () => {
    const lru = lruCreate<string, string>(10);
    expect(lru.size).toBe(0);
    expect(lru.capacity).toBe(10);
  });
});
