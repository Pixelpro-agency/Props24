import type {
    AuthChangeEvent as SupabaseAuthChangeEvent,
    AuthError as SupabaseAuthError,
    Session as SupabaseSession,
    User as SupabaseUser,
} from '@supabase/supabase-js';
import type {
    AuthAdapter,
    AuthFailure,
    AuthIdentity,
    AuthOperationResult,
    AuthSignInInput,
    AuthSignUpInput,
    AuthSignUpResult,
    AuthStateEvent,
    AuthStateListener,
} from './authAdapter';
import { getSupabaseBrowserClient } from '../supabase/client';

interface SupabaseAuthProvider {
    signInWithPassword(input: { email: string; password: string }): Promise<{
        data: { user: SupabaseUser | null };
        error: SupabaseAuthError | null;
    }>;
    signUp(input: {
        email: string;
        password: string;
        options: { data: { first_name: string; last_name: string } };
    }): Promise<{
        data: { user: SupabaseUser | null; session: SupabaseSession | null };
        error: SupabaseAuthError | null;
    }>;
    getUser(): Promise<{
        data: { user: SupabaseUser | null };
        error: SupabaseAuthError | null;
    }>;
    onAuthStateChange(callback: (
        event: SupabaseAuthChangeEvent,
        session: SupabaseSession | null,
    ) => void): { data: { subscription: { unsubscribe(): void } } };
    signOut(input: { scope: 'local' }): Promise<{
        error: SupabaseAuthError | null;
    }>;
}

const FAILURE_MESSAGES: Record<AuthFailure['code'], string> = {
    invalid_credentials: 'Credenziali non valide.',
    email_not_confirmed: 'Indirizzo email non ancora confermato.',
    already_registered: 'Questo indirizzo email è già registrato.',
    weak_password: 'La password non soddisfa i requisiti di sicurezza.',
    rate_limited: 'Troppe richieste. Riprova più tardi.',
    configuration_error: 'Configurazione Supabase non valida.',
    provider_error: 'Servizio di autenticazione non disponibile.',
};

function failure(code: AuthFailure['code']): AuthFailure {
    return { code, message: FAILURE_MESSAGES[code] };
}

function normalizeProviderError(error: unknown): AuthFailure {
    if (error instanceof Error && error.message.startsWith('Configurazione Supabase mancante:')) {
        return failure('configuration_error');
    }

    const code = typeof error === 'object' && error !== null && 'code' in error
        && typeof error.code === 'string'
        ? error.code
        : null;

    switch (code) {
        case 'invalid_credentials':
            return failure('invalid_credentials');
        case 'email_not_confirmed':
            return failure('email_not_confirmed');
        case 'email_exists':
        case 'user_already_exists':
        case 'identity_already_exists':
            return failure('already_registered');
        case 'weak_password':
            return failure('weak_password');
        case 'over_request_rate_limit':
        case 'over_email_send_rate_limit':
            return failure('rate_limited');
        default:
            return failure('provider_error');
    }
}

function identityFromUser(user: SupabaseUser | null): AuthIdentity | null {
    if (!user) {
        return null;
    }

    if (typeof user.id !== 'string' || user.id.length === 0
        || typeof user.email !== 'string' || user.email.length === 0) {
        throw new Error('Risposta Supabase Auth priva di identità valida.');
    }

    return { id: user.id, email: user.email };
}

function providerEventToApplication(event: SupabaseAuthChangeEvent): AuthStateEvent {
    switch (event) {
        case 'INITIAL_SESSION': return 'initial_session';
        case 'PASSWORD_RECOVERY': return 'password_recovery';
        case 'SIGNED_IN': return 'signed_in';
        case 'SIGNED_OUT': return 'signed_out';
        case 'TOKEN_REFRESHED': return 'token_refreshed';
        case 'USER_UPDATED': return 'user_updated';
        case 'MFA_CHALLENGE_VERIFIED': return 'mfa_challenge_verified';
    }
}

export class SupabaseAuthAdapter implements AuthAdapter {
    private readonly auth: SupabaseAuthProvider;

    constructor(auth: SupabaseAuthProvider) {
        this.auth = auth;
    }

    async signIn(input: AuthSignInInput): Promise<AuthOperationResult<AuthIdentity>> {
        try {
            const { data, error } = await this.auth.signInWithPassword({
                email: input.email.trim(),
                password: input.password,
            });
            if (error) return { ok: false, error: normalizeProviderError(error) };
            const identity = identityFromUser(data.user);
            if (!identity) throw new Error('Risposta Supabase Auth priva di utente.');
            return { ok: true, value: identity };
        } catch (error) {
            return { ok: false, error: normalizeProviderError(error) };
        }
    }

    async signUp(input: AuthSignUpInput): Promise<AuthOperationResult<AuthSignUpResult>> {
        try {
            const { data, error } = await this.auth.signUp({
                email: input.email.trim(),
                password: input.password,
                options: { data: {
                    first_name: input.firstName.trim(),
                    last_name: input.lastName.trim(),
                } },
            });
            if (error) return { ok: false, error: normalizeProviderError(error) };
            const identity = identityFromUser(data.user);
            if (!identity) throw new Error('Risposta signup Supabase priva di identità valida.');
            return { ok: true, value: {
                status: data.session ? 'authenticated' : 'confirmation_required',
                identity,
            } };
        } catch (error) {
            return { ok: false, error: normalizeProviderError(error) };
        }
    }

    async getCurrentUser(): Promise<AuthOperationResult<AuthIdentity | null>> {
        try {
            const { data, error } = await this.auth.getUser();
            if (error) return { ok: false, error: normalizeProviderError(error) };
            return { ok: true, value: identityFromUser(data.user) };
        } catch (error) {
            return { ok: false, error: normalizeProviderError(error) };
        }
    }

    subscribe(listener: AuthStateListener): () => void {
        const { data } = this.auth.onAuthStateChange((event, session) => {
            let identity: AuthIdentity | null = null;
            try {
                identity = identityFromUser(session?.user ?? null);
            } catch {
                identity = null;
            }
            listener({ event: providerEventToApplication(event), identity });
        });
        return () => data.subscription.unsubscribe();
    }

    async signOut(): Promise<AuthOperationResult<void>> {
        try {
            const { error } = await this.auth.signOut({ scope: 'local' });
            if (error) return { ok: false, error: normalizeProviderError(error) };
            return { ok: true, value: undefined };
        } catch (error) {
            return { ok: false, error: normalizeProviderError(error) };
        }
    }
}

export function createSupabaseAuthAdapter(): SupabaseAuthAdapter {
    return new SupabaseAuthAdapter(getSupabaseBrowserClient().auth);
}
