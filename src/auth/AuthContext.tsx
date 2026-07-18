import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type {
    AuthResult,
    LocalAccount,
    LoginCredentials,
    RegistrationData,
} from './auth.types';
import {
    authenticateAccount,
    clearSession,
    initializeAccounts,
    readSession,
    registerAccount,
    writeSession,
} from './authStorage';
import { setActiveDatabaseAccount } from '../db/jsonDb';

interface AuthContextValue {
    account: LocalAccount | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    login: (credentials: LoginCredentials) => Promise<AuthResult>;
    register: (data: RegistrationData) => Promise<AuthResult>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
    const [account, setAccount] = useState<LocalAccount | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    /**
     * TODO: durante lo sviluppo locale la sessione resta attiva fino al logout
     * per evitare accessi ripetuti dopo ogni refresh. In produzione introdurre
     * scadenza, rinnovo e invalidazione sicura della sessione lato backend.
     */
    useEffect(() => {
        const accounts = initializeAccounts();
        const session = readSession(accounts);

        if (!session) {
            setActiveDatabaseAccount(null);
            setAccount(null);
            setIsInitializing(false);
            return;
        }

        const authenticatedAccount =
            accounts.find(
                (storedAccount) =>
                    storedAccount.id === session.accountId,
            ) ?? null;

        if (!authenticatedAccount) {
            clearSession();
            setActiveDatabaseAccount(null);
            setAccount(null);
            setIsInitializing(false);
            return;
        }

        setActiveDatabaseAccount(authenticatedAccount.id);
        setAccount(authenticatedAccount);
        setIsInitializing(false);
    }, []);

    const login = useCallback(
        async (credentials: LoginCredentials): Promise<AuthResult> => {
            const result = authenticateAccount(credentials);

            if (result.success) {
                setActiveDatabaseAccount(result.account.id);
                setAccount(result.account);
            }

            return result;
        },
        [],
    );

    const register = useCallback(
        async (data: RegistrationData): Promise<AuthResult> => {
            const result = registerAccount(data);

            if (result.success) {
                writeSession(result.account.id);
                setActiveDatabaseAccount(result.account.id);
                setAccount(result.account);
            }

            return result;
        },
        [],
    );

    const logout = useCallback(() => {
        clearSession();
        setActiveDatabaseAccount(null);
        setAccount(null);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            account,
            isAuthenticated: account !== null,
            isInitializing,
            login,
            register,
            logout,
        }),
        [account, isInitializing, login, logout, register],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth deve essere utilizzato all’interno di AuthProvider.',
        );
    }

    return context;
}
