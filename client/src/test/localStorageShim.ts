/**
 * Node ≥22 defines a global `localStorage` getter that returns undefined
 * unless the process runs with --localstorage-file, and it shadows jsdom's
 * implementation when Vitest copies jsdom globals. Replace it with a real
 * in-memory Storage so code under test (i18next language detector) and the
 * tests themselves can use localStorage normally.
 */
class MemoryStorage implements Storage {
  #store = new Map<string, string>();

  get length(): number {
    return this.#store.size;
  }

  clear(): void {
    this.#store.clear();
  }

  getItem(key: string): string | null {
    return this.#store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.#store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, String(value));
  }
}

const storage = new MemoryStorage();

for (const target of new Set<object>([globalThis, globalThis.window].filter(Boolean))) {
  Object.defineProperty(target, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
}

export {};
