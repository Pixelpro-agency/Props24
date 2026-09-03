import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

import { useTenantDetail } from '../hooks/useTenantDetail';
import { TenantDetailHeader } from '../components/tenant-detail/TenantDetailHeader';
import { TenantInfoCard } from '../components/tenant-detail/TenantInfoCard';
import { TenantDetailTabs } from '../components/tenant-detail/TenantDetailTabs';
import { TenantActionModal, type TenantActionOperation } from '../components/tenants/TenantActionModal';
import { StatusToast, type StatusToastState } from '../components/ui/StatusToast';
import { useAuth } from '../auth/AuthContext';
import { createTenantRepository } from '../db/tenantRepository';

export function TenantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { account } = useAuth();
    const repository = useMemo(() => account?.id ? createTenantRepository({ accountId: account.id }) : null, [account?.id]);

    const {
        tenant,
        loading,
        error,
        inviteTenant,
        copyInviteLink
    } = useTenantDetail(id);

    const [pendingAction, setPendingAction] = useState<TenantActionOperation | null>(null);
    const [toast, setToast] = useState<StatusToastState | null>(() => {
        const state = location.state as { toast?: StatusToastState } | null;
        return state?.toast || null;
    });

    useEffect(() => {
        if (toast && location.state) navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate, toast]);

    const handleLifecycle = async () => {
        if (!pendingAction || !id) return;
        try {
            if (!repository) throw new Error('Database locale non disponibile: nessun account autenticato.');
            if (pendingAction === 'archive') repository.archive(id);
            else if (pendingAction === 'restore') repository.restore(id);
            else { repository.delete(id); navigate('/tenants', { replace: true }); }
            setPendingAction(null);
            setToast({ title: 'Operazione completata', message: 'Stato inquilino aggiornato.' });
        } catch (error) {
            setToast({
                variant: 'error',
                title: 'Errore',
                message: error instanceof Error ? error.message : "Impossibile eliminare i dati!\nL'inquilino è associato ad una locazione.\nArchivia l'inquilino per conservarne lo storico.",
            });
        }
    };

    const handleInvite = async () => {
        try {
            await inviteTenant();
            setToast({
                title: 'Successo',
                message: "L'invito è stato inviato.\nChiedi al tuo locatario (inquilino) di leggere l'email e cliccare sul link di invito per accettarlo.",
                action: {
                    label: 'Nuovo inquilino',
                    onClick: () => navigate('/tenants/new'),
                },
            });
        } catch (error) {
            setToast({
                variant: 'error',
                title: 'Errore',
                message: error instanceof Error ? error.message : "L'invito non è stato inviato.",
            });
        }
    };
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#72a333] rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Caricamento dettagli inquilino...</p>
                </div>
            </div>
        );
    }

    if (error || !tenant) {
        return (
            <div className="min-h-[500px] flex items-center justify-center p-6">
                <div className="bg-red-50 text-red-600 rounded-lg p-6 max-w-md text-center border border-red-200">
                    <h2 className="text-lg font-bold mb-2">Impossibile caricare i dati</h2>
                    <p className="mb-4">{error || 'Inquilino non trovato.'}</p>
                    <Link
                        to="/tenants"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Torna all'elenco
                    </Link>
                </div>
            </div>
        );
    }

    const fadeIn = {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: 'easeOut' as const },
    };
    const archived = repository?.getById(id!)?.archived ?? false;

    return (
        <div className="min-h-screen">
            <StatusToast toast={toast} onClose={() => setToast(null)} />
            <div className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
                {/* Header */}
                <TenantDetailHeader
                    title="Dati inquilino"
                    tenantId={tenant.id}
                    archived={archived}
                    onRequestAction={setPendingAction}
                />

                {/* Grid a 2 colonne */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-12 gap-5"
                    {...fadeIn}
                >
                    {/* Colonna Sinistra (Info - ca. 55-60%) */}
                    <div className="lg:col-span-7 xl:col-span-7">
                        <TenantInfoCard
                            tenant={tenant}
                            onInvite={handleInvite}
                            onCopyLink={copyInviteLink}
                        />
                    </div>

                    {/* Colonna Destra (Tabs - ca. 40-45%) */}
                    <div className="lg:col-span-5 xl:col-span-5">
                        <TenantDetailTabs tenant={tenant} />
                    </div>
                </motion.div>
            </div>

            {/* Modali */}
            <TenantActionModal isOpen={pendingAction !== null} operation={pendingAction ?? 'archive'} count={1} onClose={() => setPendingAction(null)} onConfirm={handleLifecycle} />
        </div>
    );
}
