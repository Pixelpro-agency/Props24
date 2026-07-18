import type {
    AuthResult,
    LocalAccount,
    LocalSession,
    LoginCredentials,
    RegistrationData,
} from './auth.types';

export const AUTH_ACCOUNTS_STORAGE_KEY = 'props24.auth.accounts';
export const AUTH_SESSION_STORAGE_KEY = 'props24.auth.session';

const DEFAULT_ACCOUNT_ID = 'user-001';

const DEFAULT_ACCOUNT: LocalAccount = {
    id: DEFAULT_ACCOUNT_ID,
    firstName: 'Francesco',
    lastName: 'Svara',
    email: 'francesco.svara@gmail.com',
    fiscalCode: 'SVRFNC90L20L219E',
    password: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FISCAL_CODE_PATTERN = /^[A-Z]{6}[0-9]{2}[A-EHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

let storageEnabled = true;
let memoryAccounts: LocalAccount[] = [{ ...DEFAULT_ACCOUNT }];
let memorySession: LocalSession | null = null;

interface StorageReadResult {
    available: boolean;
    value: string | null;
}

function cloneAccount(account: LocalAccount): LocalAccount {
    return { ...account };
}

function cloneAccounts(accounts: LocalAccount[]): LocalAccount[] {
    return accounts.map(cloneAccount);
}

function getStorage(): Storage | null {
    if (!storageEnabled || typeof window === 'undefined') {
        return null;
    }

    try {
        return window.localStorage;
    } catch {
        storageEnabled = false;
        return null;
    }
}

function readStorageValue(key: string): StorageReadResult {
    const storage = getStorage();

    if (!storage) {
        return {
            available: false,
            value: null,
        };
    }

    try {
        return {
            available: true,
            value: storage.getItem(key),
        };
    } catch {
        storageEnabled = false;

        return {
            available: false,
            value: null,
        };
    }
}

function writeStorageValue(key: string, value: string): void {
    const storage = getStorage();

    if (!storage) {
        return;
    }

    try {
        storage.setItem(key, value);
    } catch {
        storageEnabled = false;
    }
}

function removeStorageValue(key: string): void {
    const storage = getStorage();

    if (!storage) {
        return;
    }

    try {
        storage.removeItem(key);
    } catch {
        storageEnabled = false;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function normalizeFiscalCode(fiscalCode: string): string {
    return fiscalCode.trim().toUpperCase();
}

export function isValidEmail(email: string): boolean {
    return EMAIL_PATTERN.test(normalizeEmail(email));
}

export function isValidFiscalCode(fiscalCode: string): boolean {
    return FISCAL_CODE_PATTERN.test(normalizeFiscalCode(fiscalCode));
}

export function isValidLoginIdentifier(identifier: string): boolean {
    const normalizedIdentifier = identifier.trim();

    return normalizedIdentifier.includes('@')
        ? isValidEmail(normalizedIdentifier)
        : isValidFiscalCode(normalizedIdentifier);
}

function isLocalAccount(value: unknown): value is LocalAccount {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.id === 'string' &&
        /^user-[0-9]{3,}$/.test(value.id) &&
        typeof value.firstName === 'string' &&
        value.firstName.trim().length > 0 &&
        typeof value.lastName === 'string' &&
        value.lastName.trim().length > 0 &&
        typeof value.email === 'string' &&
        isValidEmail(value.email) &&
        typeof value.fiscalCode === 'string' &&
        isValidFiscalCode(value.fiscalCode) &&
        typeof value.password === 'string' &&
        value.password.length > 0 &&
        typeof value.createdAt === 'string' &&
        value.createdAt.length > 0
    );
}

function normalizeStoredAccount(account: LocalAccount): LocalAccount {
    return {
        ...account,
        firstName: account.firstName.trim(),
        lastName: account.lastName.trim(),
        email: normalizeEmail(account.email),
        fiscalCode: normalizeFiscalCode(account.fiscalCode),
    };
}

function parseAccounts(rawValue: string): LocalAccount[] | null {
    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (!Array.isArray(parsedValue) || !parsedValue.every(isLocalAccount)) {
            return null;
        }

        const accounts = parsedValue.map(normalizeStoredAccount);
        const uniqueIds = new Set(accounts.map((account) => account.id));

        if (uniqueIds.size !== accounts.length) {
            return null;
        }

        return accounts;
    } catch {
        return null;
    }
}

function persistAccounts(accounts: LocalAccount[]): void {
    const normalizedAccounts = accounts.map(normalizeStoredAccount);

    memoryAccounts = cloneAccounts(normalizedAccounts);
    writeStorageValue(
        AUTH_ACCOUNTS_STORAGE_KEY,
        JSON.stringify(normalizedAccounts),
    );
}

export function clearSession(): void {
    memorySession = null;
    removeStorageValue(AUTH_SESSION_STORAGE_KEY);
}

export function initializeAccounts(): LocalAccount[] {
    const storedAccounts = readStorageValue(AUTH_ACCOUNTS_STORAGE_KEY);

    if (!storedAccounts.available) {
        return cloneAccounts(memoryAccounts);
    }

    if (storedAccounts.value === null) {
        const initialAccounts = [{ ...DEFAULT_ACCOUNT }];

        persistAccounts(initialAccounts);
        return cloneAccounts(initialAccounts);
    }

    const parsedAccounts = parseAccounts(storedAccounts.value);

    if (!parsedAccounts) {
        const recoveredAccounts = [{ ...DEFAULT_ACCOUNT }];

        clearSession();
        persistAccounts(recoveredAccounts);

        return cloneAccounts(recoveredAccounts);
    }

    const containsDefaultAccount = parsedAccounts.some(
        (account) => account.id === DEFAULT_ACCOUNT_ID,
    );

    const accounts = containsDefaultAccount
        ? parsedAccounts
        : [{ ...DEFAULT_ACCOUNT }, ...parsedAccounts];

    persistAccounts(accounts);

    return cloneAccounts(accounts);
}

function parseSession(rawValue: string): LocalSession | null {
    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (!isRecord(parsedValue)) {
            return null;
        }

        const keys = Object.keys(parsedValue);

        if (
            keys.length !== 1 ||
            keys[0] !== 'accountId' ||
            typeof parsedValue.accountId !== 'string' ||
            parsedValue.accountId.length === 0
        ) {
            return null;
        }

        return {
            accountId: parsedValue.accountId,
        };
    } catch {
        return null;
    }
}

export function readSession(
    accounts: LocalAccount[] = initializeAccounts(),
): LocalSession | null {
    const storedSession = readStorageValue(AUTH_SESSION_STORAGE_KEY);
    let session: LocalSession | null;

    if (!storedSession.available) {
        session = memorySession ? { ...memorySession } : null;
    } else if (storedSession.value === null) {
        memorySession = null;
        return null;
    } else {
        session = parseSession(storedSession.value);

        if (!session) {
            clearSession();
            return null;
        }
    }

    if (
        session &&
        !accounts.some((account) => account.id === session.accountId)
    ) {
        clearSession();
        return null;
    }

    memorySession = session ? { ...session } : null;

    return session ? { ...session } : null;
}

export function writeSession(accountId: string): void {
    const session: LocalSession = {
        accountId,
    };

    memorySession = { ...session };
    writeStorageValue(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function findAccountByIdentifier(
    identifier: string,
    accounts: LocalAccount[] = initializeAccounts(),
): LocalAccount | null {
    const normalizedIdentifier = identifier.trim();

    if (normalizedIdentifier.includes('@')) {
        const normalizedEmail = normalizeEmail(normalizedIdentifier);

        return (
            accounts.find(
                (account) =>
                    normalizeEmail(account.email) === normalizedEmail,
            ) ?? null
        );
    }

    const normalizedFiscalCode = normalizeFiscalCode(normalizedIdentifier);

    return (
        accounts.find(
            (account) =>
                normalizeFiscalCode(account.fiscalCode) ===
                normalizedFiscalCode,
        ) ?? null
    );
}

export function authenticateAccount(
    credentials: LoginCredentials,
): AuthResult {
    if (!isValidLoginIdentifier(credentials.identifier)) {
        return {
            success: false,
            error: "Inserisci un codice fiscale o un'email validi.",
        };
    }

    const account = findAccountByIdentifier(credentials.identifier);

    if (!account || account.password !== credentials.password) {
        return {
            success: false,
            error: 'Credenziali non valide.',
        };
    }

    writeSession(account.id);

    return {
        success: true,
        account: cloneAccount(account),
    };
}

function getNextAccountId(accounts: LocalAccount[]): string {
    const highestId = accounts.reduce((highestValue, account) => {
        const match = /^user-([0-9]+)$/.exec(account.id);

        if (!match) {
            return highestValue;
        }

        const numericValue = Number.parseInt(match[1], 10);

        return Number.isNaN(numericValue)
            ? highestValue
            : Math.max(highestValue, numericValue);
    }, 1);

    return `user-${String(highestId + 1).padStart(3, '0')}`;
}

export function registerAccount(data: RegistrationData): AuthResult {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = normalizeEmail(data.email);
    const fiscalCode = normalizeFiscalCode(data.fiscalCode);

    if (
        !firstName ||
        !lastName ||
        !email ||
        !fiscalCode ||
        !data.password ||
        !data.confirmPassword
    ) {
        return {
            success: false,
            error: 'Tutti i campi sono obbligatori.',
        };
    }

    if (!isValidEmail(email)) {
        return {
            success: false,
            error: "Inserisci un'email valida.",
        };
    }

    if (!isValidFiscalCode(fiscalCode)) {
        return {
            success: false,
            error: 'Inserisci un codice fiscale valido.',
        };
    }

    if (data.password !== data.confirmPassword) {
        return {
            success: false,
            error: 'Le password non coincidono.',
        };
    }

    const accounts = initializeAccounts();

    if (
        accounts.some(
            (account) => normalizeEmail(account.email) === email,
        )
    ) {
        return {
            success: false,
            error: 'Questa email è già associata a un account.',
        };
    }

    if (
        accounts.some(
            (account) =>
                normalizeFiscalCode(account.fiscalCode) === fiscalCode,
        )
    ) {
        return {
            success: false,
            error: 'Questo codice fiscale è già associato a un account.',
        };
    }

    const account: LocalAccount = {
        id: getNextAccountId(accounts),
        firstName,
        lastName,
        email,
        fiscalCode,

        // TODO: questa autenticazione è soltanto una simulazione locale.
        // In produzione la password non deve essere salvata nel localStorage
        // e login, hashing, sessione e autorizzazione devono essere gestiti
        // da un backend sicuro.
        password: data.password,

        createdAt: new Date().toISOString(),
    };

    persistAccounts([...accounts, account]);

    return {
        success: true,
        account: cloneAccount(account),
    };
}
