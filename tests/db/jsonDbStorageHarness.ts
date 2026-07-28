export type StorageWrite = Readonly<{
  key: string;
  value: string;
}>;

export type StorageOperation =
  | Readonly<{ type: 'set'; key: string; value: string }>
  | Readonly<{ type: 'remove'; key: string }>;

export class MemoryStorage implements Storage {
  readonly setItemCalls: StorageWrite[] = [];
  readonly removeItemCalls: string[] = [];
  readonly operations: StorageOperation[] = [];

  private readonly values = new Map<string, string>();
  private nextSetError: unknown | null = null;
  private corruptNextSetValue: string | null = null;

  constructor(initialValues: Readonly<Record<string, string>> = {}) {
    Object.entries(initialValues).forEach(([key, value]) => {
      this.values.set(key, value);
    });
  }

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.removeItemCalls.push(key);
    this.operations.push({ type: 'remove', key });
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this.nextSetError !== null) {
      const error = this.nextSetError;
      this.nextSetError = null;
      throw error;
    }
    this.setItemCalls.push({ key, value });
    this.operations.push({ type: 'set', key, value });
    this.values.set(key, this.corruptNextSetValue ?? value);
    this.corruptNextSetValue = null;
  }

  writesFor(key: string): StorageWrite[] {
    return this.setItemCalls.filter((call) => call.key === key);
  }

  failNextSet(error: unknown): void {
    this.nextSetError = error;
  }

  corruptNextSet(value: string): void {
    this.corruptNextSetValue = value;
  }

  resetOperationLogs(): void {
    this.setItemCalls.length = 0;
    this.removeItemCalls.length = 0;
    this.operations.length = 0;
  }
}

let previousWindowDescriptor: PropertyDescriptor | undefined;

export function installJsonDbWindow(storage: MemoryStorage): void {
  previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const events = new EventTarget();
  const fakeWindow = {
    localStorage: storage,
    dispatchEvent: events.dispatchEvent.bind(events),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: fakeWindow as unknown as Window,
  });
}

export function uninstallJsonDbWindow(): void {
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
  previousWindowDescriptor = undefined;
}
