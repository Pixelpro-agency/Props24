import { useState, useEffect } from 'react';
import type { TenantDetail } from '../types/tenantDetail';
import { deleteTenantById, getTenantById, sendTenantInvite } from '../db/tenantRepository';
import { subscribeJsonDb } from '../db/jsonDb';

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
        const loadTenant = () => {
            setLoading(true);
            setError(null);

            if (!id) {
                setTenant(null);
                setError('ID inquilino non fornito');
                setLoading(false);
                return;
            }

            try {
                const data = getTenantById(id);
                setTenant(data);
                if (!data) setError('Inquilino non trovato');
            } catch {
                setTenant(null);
                setError('Si e verificato un errore durante il caricamento');
            } finally {
                setLoading(false);
            }
        };

        loadTenant();
        return subscribeJsonDb(loadTenant);
    }, [id]);

    const deleteTenant = async () => {
        if (!tenant) return;
        deleteTenantById(tenant.id);
    };

    const inviteTenant = async () => {
        if (!tenant) return;
        sendTenantInvite(tenant.id);
    };

    const copyInviteLink = () => {
        if (tenant?.inviteLink?.url) {
            void navigator.clipboard.writeText(tenant.inviteLink.url);
        }
    };

    return {
        tenant,
        loading,
        error,
        deleteTenant,
        inviteTenant,
        copyInviteLink,
    };
}
