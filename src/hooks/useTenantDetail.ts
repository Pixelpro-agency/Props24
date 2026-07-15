import { useState, useEffect } from 'react';
import type { TenantDetail } from '../types/tenantDetail';
import { buildTenantDetail } from '../data/mockTenantDetail';

interface UseTenantDetailReturn {
    tenant: TenantDetail | null;
    loading: boolean;
    error: string | null;
    deleteTenant: () => Promise<void>;
    inviteTenant: () => Promise<void>;
    copyInviteLink: () => void;
}

export function useTenantDetail(id: string | undefined): UseTenantDetailReturn {
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        if (!id) {
            setError('ID inquilino non fornito');
            setLoading(false);
            return;
        }

        // Simulazione caricamento API
        const loadTenant = async () => {
            try {
                // Piccolo delay per mostrare il loading status
                await new Promise(resolve => setTimeout(resolve, 800));

                const data = buildTenantDetail(id);

                if (!isMounted) return;

                if (data) {
                    setTenant(data);
                } else {
                    setError('Inquilino non trovato');
                }
            } catch (err) {
                if (isMounted) setError('Si è verificato un errore durante il caricamento');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadTenant();

        return () => {
            isMounted = false;
        };
    }, [id]);

    const deleteTenant = async () => {
        // Simulazione cancellazione
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[API Mock] Delete tenant ${id}`);
        // In una vera app qui faresti una chiamata API e redirigeresti l'utente
        // o lanceresti un evento per rimuovere dallo store
    };

    const inviteTenant = async () => {
        // Simulazione generazione/invio link
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[API Mock] Inviato invito al tenant ${id}`);
        if (tenant) {
            setTenant({
                ...tenant,
                loginStatus: { status: 'pending_invitation' }
            });
        }
    };

    const copyInviteLink = () => {
        if (tenant?.inviteLink?.url) {
            navigator.clipboard.writeText(tenant.inviteLink.url)
                .then(() => {
                    // Ideale: mostrare un toast/snackbar
                    console.log('Link copiato');
                })
                .catch(err => {
                    console.error('Errore copia clipboard', err);
                });
        }
    };

    return {
        tenant,
        loading,
        error,
        deleteTenant,
        inviteTenant,
        copyInviteLink
    };
}
