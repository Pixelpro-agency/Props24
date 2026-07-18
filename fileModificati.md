This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: src/components/auth/AuthModal.tsx
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
src/
  components/
    auth/
      AuthModal.tsx
```

# Files

## File: src/components/auth/AuthModal.tsx
```typescript
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import type {
    LoginCredentials,
    RegistrationData,
} from '../../auth/auth.types';
import {
    isValidEmail,
    isValidFiscalCode,
    isValidLoginIdentifier,
} from '../../auth/authStorage';

type AuthMode = 'login' | 'register';

const inputClassName =
    'block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500';

const emptyLoginForm: LoginCredentials = {
    identifier: '',
    password: '',
};

const emptyRegistrationForm: RegistrationData = {
    firstName: '',
    lastName: '',
    fiscalCode: '',
    email: '',
    password: '',
    confirmPassword: '',
};

export function AuthModal() {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loginForm, setLoginForm] =
        useState<LoginCredentials>(emptyLoginForm);
    const [registrationForm, setRegistrationForm] =
        useState<RegistrationData>(emptyRegistrationForm);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const changeMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        setError(null);
    };

    const handleLoginSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError(null);

        const identifier = loginForm.identifier.trim();

        if (!isValidLoginIdentifier(identifier)) {
            setError("Inserisci un codice fiscale o un'email validi.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await login({
                identifier,
                password: loginForm.password,
            });

            if (!result.success) {
                setError(result.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegistrationSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError(null);

        const normalizedData: RegistrationData = {
            ...registrationForm,
            firstName: registrationForm.firstName.trim(),
            lastName: registrationForm.lastName.trim(),
            fiscalCode: registrationForm.fiscalCode.trim(),
            email: registrationForm.email.trim(),
        };

        if (
            !normalizedData.firstName ||
            !normalizedData.lastName ||
            !normalizedData.fiscalCode ||
            !normalizedData.email ||
            !normalizedData.password ||
            !normalizedData.confirmPassword
        ) {
            setError('Tutti i campi sono obbligatori.');
            return;
        }

        if (!isValidFiscalCode(normalizedData.fiscalCode)) {
            setError('Inserisci un codice fiscale valido.');
            return;
        }

        if (!isValidEmail(normalizedData.email)) {
            setError("Inserisci un'email valida.");
            return;
        }

        if (
            normalizedData.password !==
            normalizedData.confirmPassword
        ) {
            setError('Le password non coincidono.');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await register(normalizedData);

            if (!result.success) {
                setError(result.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateRegistrationField = (
        field: keyof RegistrationData,
        value: string,
    ) => {
        setRegistrationForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    };

    const isLoginMode = mode === 'login';
    const title = isLoginMode ? 'Accedi a Props24' : 'Crea account';

    return (
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-black/40 p-4">
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
                className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
            >
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                        Props24
                    </p>

                    <h1
                        id="auth-modal-title"
                        className="text-xl font-semibold text-gray-800"
                    >
                        {title}
                    </h1>

                    <p className="mt-1.5 text-sm leading-5 text-gray-500">
                        Simulazione locale di autenticazione per lo sviluppo
                        frontend.
                    </p>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    {error ? (
                        <div
                            id="auth-error"
                            role="alert"
                            className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                        >
                            {error}
                        </div>
                    ) : null}

                    {isLoginMode ? (
                        <form
                            onSubmit={handleLoginSubmit}
                            aria-describedby={error ? 'auth-error' : undefined}
                            noValidate
                        >
                            <div>
                                <label
                                    htmlFor="login-identifier"
                                    className={labelClassName}
                                >
                                    Codice fiscale oppure email
                                </label>

                                <input
                                    id="login-identifier"
                                    name="identifier"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    disabled={isSubmitting}
                                    value={loginForm.identifier}
                                    onChange={(event) =>
                                        setLoginForm((currentForm) => ({
                                            ...currentForm,
                                            identifier: event.target.value,
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>

                            <div className="mt-4">
                                <label
                                    htmlFor="login-password"
                                    className={labelClassName}
                                >
                                    Password
                                </label>

                                <input
                                    id="login-password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    disabled={isSubmitting}
                                    value={loginForm.password}
                                    onChange={(event) =>
                                        setLoginForm((currentForm) => ({
                                            ...currentForm,
                                            password: event.target.value,
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>

                            <div className="mt-6 space-y-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex w-full items-center justify-center rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Accesso in corso…' : 'Accedi'}
                                </button>
        
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => changeMode('register')}
                                    className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Crea account
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={handleRegistrationSubmit}
                            aria-describedby={error ? 'auth-error' : undefined}
                            noValidate
                        >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="register-first-name"
                                        className={labelClassName}
                                    >
                                        Nome
                                    </label>

                                    <input
                                        id="register-first-name"
                                        name="firstName"
                                        type="text"
                                        autoComplete="given-name"
                                        required
                                        disabled={isSubmitting}
                                        value={registrationForm.firstName}
                                        onChange={(event) =>
                                            updateRegistrationField(
                                                'firstName',
                                                event.target.value,
                                            )
                                        }
                                        className={inputClassName}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="register-last-name"
                                        className={labelClassName}
                                    >
                                        Cognome
                                    </label>

                                    <input
                                        id="register-last-name"
                                        name="lastName"
                                        type="text"
                                        autoComplete="family-name"
                                        required
                                        disabled={isSubmitting}
                                        value={registrationForm.lastName}
                                        onChange={(event) =>
                                            updateRegistrationField(
                                                'lastName',
                                                event.target.value,
                                            )
                                        }
                                        className={inputClassName}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label
                                    htmlFor="register-fiscal-code"
                                    className={labelClassName}
                                >
                                    Codice fiscale
                                </label>

                                <input
                                    id="register-fiscal-code"
                                    name="fiscalCode"
                                    type="text"
                                    autoComplete="off"
                                    required
                                    disabled={isSubmitting}
                                    value={registrationForm.fiscalCode}
                                    onChange={(event) =>
                                        updateRegistrationField(
                                            'fiscalCode',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClassName}
                                />
                            </div>

                            <div className="mt-4">
                                <label
                                    htmlFor="register-email"
                                    className={labelClassName}
                                >
                                    Email
                                </label>

                                <input
                                    id="register-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    disabled={isSubmitting}
                                    value={registrationForm.email}
                                    onChange={(event) =>
                                        updateRegistrationField(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClassName}
                                />
                            </div>

                            <div className="mt-4">
                                <label
                                    htmlFor="register-password"
                                    className={labelClassName}
                                >
                                    Password
                                </label>

                                <input
                                    id="register-password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    disabled={isSubmitting}
                                    value={registrationForm.password}
                                    onChange={(event) =>
                                        updateRegistrationField(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClassName}
                                />
                            </div>

                            <div className="mt-4">
                                <label
                                    htmlFor="register-confirm-password"
                                    className={labelClassName}
                                >
                                    Conferma password
                                </label>

                                <input
                                    id="register-confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    disabled={isSubmitting}
                                    value={registrationForm.confirmPassword}
                                    onChange={(event) =>
                                        updateRegistrationField(
                                            'confirmPassword',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClassName}
                                />
                            </div>

                            <div className="mt-6 space-y-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex w-full items-center justify-center rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting
                                        ? 'Creazione in corso…'
                                        : 'Crea account'}
                                </button>
        
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => changeMode('login')}
                                    className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Torna al login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </div>
    );
}
```
