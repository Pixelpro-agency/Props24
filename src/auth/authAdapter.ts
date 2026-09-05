export interface AuthIdentity {
    id: string;
    email: string;
}

export interface AuthSignInInput {
    email: string;
    password: string;
}

export interface AuthSignUpInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export type AuthFailureCode =
    | 'invalid_credentials'
    | 'email_not_confirmed'
    | 'already_registered'
    | 'weak_password'
    | 'rate_limited'
    | 'configuration_error'
    | 'provider_error';

export interface AuthFailure {
    code: AuthFailureCode;
    message: string;
}

export type AuthOperationResult<T> =
    | { ok: true; value: T }
    | { ok: false; error: AuthFailure };

export type AuthSignUpResult =
    | { status: 'authenticated'; identity: AuthIdentity }
    | { status: 'confirmation_required'; identity: AuthIdentity };

export type AuthStateEvent =
    | 'initial_session'
    | 'password_recovery'
    | 'signed_in'
    | 'signed_out'
    | 'token_refreshed'
    | 'user_updated'
    | 'mfa_challenge_verified';

export interface AuthStateChange {
    event: AuthStateEvent;
    identity: AuthIdentity | null;
}

export type AuthStateListener = (change: AuthStateChange) => void;

export interface AuthAdapter {
    signIn(input: AuthSignInInput): Promise<AuthOperationResult<AuthIdentity>>;
    signUp(input: AuthSignUpInput): Promise<AuthOperationResult<AuthSignUpResult>>;
    getCurrentUser(): Promise<AuthOperationResult<AuthIdentity | null>>;
    subscribe(listener: AuthStateListener): () => void;
    signOut(): Promise<AuthOperationResult<void>>;
}
