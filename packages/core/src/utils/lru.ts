export const DEFAULT_MAX_LRU_SIZE = 300;

// LRU cache implementation
export default class LRU<K, V> {
  private map: Map<K, V>;

  private max: number;

  constructor(max: number = DEFAULT_MAX_LRU_SIZE) {
    this.map = new Map();
    this.max = max;
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);

    if (value) {
      this.map.delete(key);

      this.map.set(key, value);
    }

    return value;
  }

  set(key: K, value: V) {
    if (this.map.size >= this.max) {
      // delete oldest entry
      this.map.delete(this.map.keys().next().value);
    }

    this.map.set(key, value);
  }

  delete(key: K) {
    this.map.delete(key);
  }

  get size(): number {
    return this.map.size;
  }

  get capacity(): number {
    return this.max;
  }
}

// LRU's constructor isn't visible outside of the package, so we need to export a factory function
export function lruCreate<K, V>(max: number = DEFAULT_MAX_LRU_SIZE): LRU<K, V> {
  return new LRU<K, V>(max);
}
