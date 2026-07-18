/**
 * Hook per il profilo dell'utente corrente.
 */

import { useAuth } from '../auth/AuthContext';
import type { UserProfile } from '../types/dashboard';

interface UserProfileReturn {
    user: UserProfile;
    /** Nome completo per il saluto */
    displayName: string;
    isLoading: boolean;
}

const emptyUserProfile: UserProfile = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
};

export function useUserProfile(): UserProfileReturn {
    const { account, isInitializing } = useAuth();

    const user: UserProfile = account
        ? {
              id: account.id,
              firstName: account.firstName,
              lastName: account.lastName,
              email: account.email,
          }
        : emptyUserProfile;

    const displayName = account
        ? `${account.firstName} ${account.lastName}`.trim()
        : '';

    return {
        user,
        displayName,
        isLoading: isInitializing,
    };
}
