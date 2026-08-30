import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { usePropertyDetail } from '../hooks/usePropertyDetail';
import { createPropertyLifecycleRepository } from '../db/propertyLifecycleRepository';
import { PropertyActionModal, type PropertyActionOperation } from '../components/properties/PropertyActionModal';
import { StatusToast, type StatusToastState } from '../components/ui/StatusToast';
import { MediaGallery } from '../components/property-detail/MediaGallery';
import { PropertyInfoCard } from '../components/property-detail/PropertyInfoCard';
import { PropertyDetails } from '../components/property-detail/PropertyDetails';
import { CalendarSync } from '../components/property-detail/CalendarSync';
import { PublicProfile } from '../components/property-detail/PublicProfile';
import { DetailTabs } from '../components/property-detail/DetailTabs';

export function PropertyDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { account } = useAuth();
    const accountId = account?.id ?? null;
    const repository = useMemo(() => accountId ? createPropertyLifecycleRepository({ accountId }) : null, [accountId]);
    const [pendingAction, setPendingAction] = useState<PropertyActionOperation | null>(null);
    const [toast, setToast] = useState<StatusToastState | null>(null);
    const { property, loading, error, notes, handleAddNote, handleDeleteNote, handleVisibilityChange } = usePropertyDetail(id);

    if (loading) return <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50/50"><p role="status">Caricamento dettagli proprietà...</p></div>;
    if (error || !property) return <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50/50"><div className="bg-red-50 text-red-600 rounded-lg p-6 max-w-md text-center border border-red-200"><h2 className="text-lg font-bold mb-2">Impossibile caricare i dati</h2><p className="mb-4">{error || 'Si è verificato un errore imprevisto.'}</p><Link to="/properties/units">Torna all&apos;elenco</Link></div></div>;

    const confirmAction = () => {
        if (!pendingAction || !repository) return;
        try {
            if (pendingAction === 'archive') repository.archive(property.id);
            if (pendingAction === 'restore') repository.restore(property.id);
            if (pendingAction === 'delete') {
                repository.delete(property.id);
                setPendingAction(null);
                navigate('/properties/units', { replace: true });
                return;
            }
            setToast({ variant: 'success', title: 'Successo', message: pendingAction === 'archive' ? 'Unità archiviata.' : 'Unità ripristinata.' });
            setPendingAction(null);
        } catch (actionError) {
            setToast({ variant: 'error', title: 'Errore', message: actionError instanceof Error ? actionError.message : "Operazione sull'unità non riuscita." });
        }
    };

    return <div className="min-h-screen"><div className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <StatusToast toast={toast} onClose={() => setToast(null)} />
        <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3"><Link to="/properties/units" aria-label="Torna alle proprietà"><ArrowLeft className="h-5 w-5" /></Link><h1 className="text-xl font-semibold">{property.title}</h1>{property.archived ? <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">Archiviata</span> : null}</div>
            <div className="flex flex-wrap gap-2">
                <Link className="rounded-md border px-3 py-2 text-sm" to={`/properties/units/${property.id}/edit`}>Modifica</Link>
                <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setPendingAction(property.archived ? 'restore' : 'archive')}>{property.archived ? 'Ripristina' : 'Archivia'}</button>
                <button className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700" onClick={() => setPendingAction('delete')}>Elimina</button>
            </div>
        </div>
        <motion.div className="grid grid-cols-1 lg:grid-cols-5 gap-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="lg:col-span-3 flex flex-col gap-5"><MediaGallery property={property} /><PropertyInfoCard property={property} /><PropertyDetails property={property} /><CalendarSync property={property} /><PublicProfile property={property} onVisibilityChange={handleVisibilityChange} /></div>
            <div className="lg:col-span-2"><DetailTabs property={property} notes={notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} /></div>
        </motion.div>
        {pendingAction ? <PropertyActionModal isOpen operation={pendingAction} count={1} onClose={() => setPendingAction(null)} onConfirm={confirmAction} /> : null}
    </div></div>;
}
