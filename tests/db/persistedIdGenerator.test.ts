import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateId } from '../../src/utils/id';
import { generateId as generateIdFromJsonDb } from '../../src/db/jsonDb';

const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

function setCrypto(value: Partial<Crypto> | undefined) {
    if (value) Object.defineProperty(globalThis, 'crypto', { configurable: true, value });
    else Reflect.deleteProperty(globalThis, 'crypto');
}

afterEach(() => {
    if (originalCryptoDescriptor) Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
    else Reflect.deleteProperty(globalThis, 'crypto');
    vi.restoreAllMocks();
});

describe('generatore canonico degli ID persistenti', () => {
    it('mantiene jsonDb.generateId come re-export della funzione canonica', () => {
        expect(generateIdFromJsonDb).toBe(generateId);
    });

    it('usa randomUUID e mantiene il prefisso', () => {
        setCrypto({ randomUUID: () => '123e4567-e89b-42d3-a456-426614174000' });
        expect(generateId('key')).toBe('key-123e4567-e89b-42d3-a456-426614174000');
    });

    it('usa getRandomValues per UUID v4 distinti quando randomUUID non è disponibile', () => {
        let seed = 0;
        setCrypto({ getRandomValues: ((array: Uint8Array) => {
            array.fill(++seed);
            return array;
        }) as Crypto['getRandomValues'] });

        const first = generateId('file');
        const second = generateId('file');
        expect(first).toMatch(/^file-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(second).toMatch(/^file-[0-9a-f-]{36}$/);
        expect(second).not.toBe(first);
    });

    it('fallisce esplicitamente senza API crypto adeguate', () => {
        setCrypto(undefined);
        expect(() => generateId('key')).toThrow('Generazione ID persistente non disponibile.');
    });

    it('non usa generatori deboli nel modulo canonico', async () => {
        const source = await import('node:fs/promises').then((fs) => fs.readFile('src/utils/id.ts', 'utf8'));
        expect(source).not.toContain('Date.now');
        expect(source).not.toContain('Math.random');
    });
});
