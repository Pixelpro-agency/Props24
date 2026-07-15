/**
 * Mock user profile for the dashboard greeting.
 *
 * NOTE: Questo file è un placeholder. Quando verrà implementato il sistema
 * di autenticazione (login/logout), i dati dell'utente verranno sostituiti
 * con quelli reali provenienti dal backend / auth provider.
 */
import type { UserProfile } from '../types/dashboard';

export const mockUserProfile: UserProfile = {
    id: 'user-001',
    firstName: 'Utente',
    lastName: 'Demo',
    email: 'utente.demo@gestionale.it',
};
