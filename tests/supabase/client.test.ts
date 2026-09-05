import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock } = vi.hoisted(() => ({
    createClientMock: vi.fn(() => ({ auth: {} })),
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: createClientMock,
}));

describe('Supabase browser client', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.unstubAllEnvs();
        createClientMock.mockClear();
    });

    it('fallisce esplicitamente senza URL', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', '');
        vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
        const { getSupabaseBrowserClient } = await import('../../src/supabase/client');
        expect(() => getSupabaseBrowserClient()).toThrow(
            'Configurazione Supabase mancante: VITE_SUPABASE_URL.',
        );
        expect(createClientMock).not.toHaveBeenCalled();
    });

    it('fallisce esplicitamente senza publishable key', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
        vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '   ');
        const { getSupabaseBrowserClient } = await import('../../src/supabase/client');
        expect(() => getSupabaseBrowserClient()).toThrow(
            'Configurazione Supabase mancante: VITE_SUPABASE_PUBLISHABLE_KEY.',
        );
    });

    it('crea una sola istanza con configurazione browser-safe', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', ' https://example.supabase.co ');
        vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', ' publishable-key ');
        const { getSupabaseBrowserClient } = await import('../../src/supabase/client');
        const first = getSupabaseBrowserClient();
        const second = getSupabaseBrowserClient();
        expect(first).toBe(second);
        expect(createClientMock).toHaveBeenCalledOnce();
        expect(createClientMock).toHaveBeenCalledWith(
            'https://example.supabase.co',
            'publishable-key',
            { auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            } },
        );
    });
});
