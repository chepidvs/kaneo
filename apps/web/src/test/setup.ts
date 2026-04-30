import "@testing-library/jest-dom/vitest";

const localStorageStore = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    clear: () => localStorageStore.clear(),
    getItem: (key: string) => localStorageStore.get(key) ?? null,
    key: (index: number) => Array.from(localStorageStore.keys())[index] ?? null,
    get length() {
      return localStorageStore.size;
    },
    removeItem: (key: string) => localStorageStore.delete(key),
    setItem: (key: string, value: string) => {
      localStorageStore.set(key, value);
    },
  },
});
