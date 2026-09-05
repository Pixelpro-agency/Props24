import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAuthAdapter } from '../../src/auth/supabaseAuthAdapter';

function user(id = '8d192dec-7504-49df-90f6-850bc8521848', email = 'user@example.com') {
    return { id, email } as never;
}

function provider() {
    return {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        getUser: vi.fn(),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn(),
    };
}

describe('SupabaseAuthAdapter', () => {
    let auth: ReturnType<typeof provider>;
    let adapter: SupabaseAuthAdapter;

    beforeEach(() => {
        auth = provider();
        adapter = new SupabaseAuthAdapter(auth as never);
    });

    it('esegue sign in email/password e restituisce solo AuthIdentity', async () => {
        auth.signInWithPassword.mockResolvedValue({ data: { user: user() }, error: null });
        const result = await adapter.signIn({
            email: ' user@example.com ',
            password: 'secret-password',
        });
        expect(auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: 'secret-password',
        });
        expect(result).toEqual({ ok: true, value: {
            id: '8d192dec-7504-49df-90f6-850bc8521848',
            email: 'user@example.com',
        } });
        expect(JSON.stringify(result)).not.toMatch(/password|access_token|refresh_token/);
    });

    it('normalizza invalid_credentials usando il code strutturato', async () => {
        auth.signInWithPassword.mockResolvedValue({
            data: { user: null },
            error: { code: 'invalid_credentials', message: 'testo variabile' },
        });
        await expect(adapter.signIn({ email: 'x@example.com', password: 'x' }))
            .resolves.toEqual({ ok: false, error: {
                code: 'invalid_credentials',
                message: 'Credenziali non valide.',
            } });
    });

    it('invia al signup solo email, password e metadata nominali', async () => {
        auth.signUp.mockResolvedValue({
            data: { user: user(), session: { user: user() } }, error: null,
        });
        const input = {
            firstName: ' Ada ', lastName: ' Lovelace ',
            email: ' ada@example.com ', password: 'strong-password',
        };
        await adapter.signUp(input);
        expect(auth.signUp).toHaveBeenCalledWith({
            email: 'ada@example.com',
            password: 'strong-password',
            options: { data: { first_name: 'Ada', last_name: 'Lovelace' } },
        });
        expect(JSON.stringify(auth.signUp.mock.calls[0])).not.toMatch(
            /confirmPassword|fiscalCode|workspace|role|permissions/,
        );
    });

    it('distingue signup autenticato', async () => {
        auth.signUp.mockResolvedValue({
            data: { user: user(), session: { user: user() } }, error: null,
        });
        const result = await adapter.signUp({
            firstName: 'Ada', lastName: 'Lovelace',
            email: 'ada@example.com', password: 'strong-password',
        });
        expect(result).toMatchObject({ ok: true, value: { status: 'authenticated' } });
    });

    it('distingue signup con conferma richiesta', async () => {
        auth.signUp.mockResolvedValue({ data: { user: user(), session: null }, error: null });
        const result = await adapter.signUp({
            firstName: 'Ada', lastName: 'Lovelace',
            email: 'ada@example.com', password: 'strong-password',
        });
        expect(result).toMatchObject({
            ok: true, value: { status: 'confirmation_required' },
        });
    });

    it('rifiuta una risposta signup incoerente', async () => {
        auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: null });
        const result = await adapter.signUp({
            firstName: 'Ada', lastName: 'Lovelace',
            email: 'ada@example.com', password: 'strong-password',
        });
        expect(result).toMatchObject({ ok: false, error: { code: 'provider_error' } });
    });

    it('converte current user e gestisce assenza utente', async () => {
        auth.getUser.mockResolvedValueOnce({ data: { user: user() }, error: null });
        await expect(adapter.getCurrentUser()).resolves.toMatchObject({
            ok: true, value: { email: 'user@example.com' },
        });
        auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
        await expect(adapter.getCurrentUser()).resolves.toEqual({ ok: true, value: null });
    });

    it('normalizza gli eventi e rimuove realmente la subscription', () => {
        const unsubscribe = vi.fn();
        let callback!: (event: string, session: unknown) => void;
        auth.onAuthStateChange.mockImplementation((next) => {
            callback = next;
            return { data: { subscription: { unsubscribe } } };
        });
        const listener = vi.fn();
        const stop = adapter.subscribe(listener);
        callback('SIGNED_IN', { user: user() });
        expect(listener).toHaveBeenCalledWith({
            event: 'signed_in',
            identity: {
                id: '8d192dec-7504-49df-90f6-850bc8521848',
                email: 'user@example.com',
            },
        });
        expect(JSON.stringify(listener.mock.calls)).not.toMatch(/access_token|refresh_token/);
        stop();
        expect(unsubscribe).toHaveBeenCalledOnce();
    });

    it('esegue logout soltanto sulla sessione locale', async () => {
        auth.signOut.mockResolvedValue({ error: null });
        await expect(adapter.signOut()).resolves.toEqual({ ok: true, value: undefined });
        expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it.each([
        ['email_not_confirmed', 'email_not_confirmed'],
        ['user_already_exists', 'already_registered'],
        ['weak_password', 'weak_password'],
        ['over_request_rate_limit', 'rate_limited'],
        ['unrecognized_code', 'provider_error'],
    ])('normalizza %s senza esporre AuthError', async (providerCode, expectedCode) => {
        auth.signInWithPassword.mockResolvedValue({
            data: { user: null }, error: { code: providerCode, message: 'provider detail' },
        });
        const result = await adapter.signIn({ email: 'x@example.com', password: 'x' });
        expect(result).toMatchObject({ ok: false, error: { code: expectedCode } });
        expect(JSON.stringify(result)).not.toContain('provider detail');
    });
});
