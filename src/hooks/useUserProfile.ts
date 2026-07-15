/**
 * Hook per il profilo dell'utente corrente.
 *
 * NOTE: Per ora restituisce un mock statico.
 * Quando verrà implementato il sistema di autenticazione, questo hook
 * verrà aggiornato per leggere i dati reali dall'auth provider / backend.
 */
import type { UserProfile } from '../types/dashboard';
import { mockUserProfile } from '../data/mockUserProfile';

interface UserProfileReturn {
    user: UserProfile;
    /** Nome completo per il saluto */
    displayName: string;
    isLoading: boolean;
}

export function useUserProfile(): UserProfileReturn {
    // TODO: sostituire con dati reali dal sistema di autenticazione
    const user = mockUserProfile;

    const displayName = `${user.firstName} ${user.lastName}`.trim();

    return {
        user,
        displayName,
        isLoading: false,
    };
}
