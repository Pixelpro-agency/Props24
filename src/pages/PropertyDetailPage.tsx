import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react';
import { usePropertyDetail } from '../hooks/usePropertyDetail';

/* ── Real components ── */
import { MediaGallery } from '../components/property-detail/MediaGallery';
import { PropertyInfoCard } from '../components/property-detail/PropertyInfoCard';
import { PropertyDetails } from '../components/property-detail/PropertyDetails';
import { CalendarSync } from '../components/property-detail/CalendarSync';
import { PublicProfile } from '../components/property-detail/PublicProfile';
import { DetailTabs } from '../components/property-detail/DetailTabs';

/* ── Page Header with actions dropdown ── */

function PageDetailHeader({ title }: { title: string }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <Link
                    to="/properties/units"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Torna alle proprietà"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">
                    {title}
                </h1>
            </div>
            <div className="relative">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Azioni"
                >
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                            <button
                                onClick={() => { setMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Pencil className="w-4 h-4" /> Modifica
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Sei sicuro di voler eliminare questa proprietà?')) {
                                        alert('Proprietà eliminata (mock)');
                                    }
                                    setMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Elimina
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   ██ MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════ */

export function PropertyDetailPage() {
    const { id } = useParams<{ id: string }>();

    const {
        property,
        loading,
        error,
        notes,
        handleAddNote,
        handleDeleteNote,
        handleVisibilityChange,
    } = usePropertyDetail(id);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#72a333] rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Caricamento dettagli proprietà...</p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50/50">
                <div className="bg-red-50 text-red-600 rounded-lg p-6 max-w-md text-center border border-red-200">
                    <h2 className="text-lg font-bold mb-2">Impossibile caricare i dati</h2>
                    <p className="mb-4">{error || 'Si è verificato un errore imprevisto.'}</p>
                    <Link
                        to="/properties/units"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Torna all'elenco
                    </Link>
                </div>
            </div>
        );
    }

    // Fade-in animation
    const fadeIn = {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: 'easeOut' as const },
    };

    return (
        <div className="min-h-screen">

            {/* Page content */}
            <div className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
                {/* Page Header */}
                <PageDetailHeader title={property.title} />

                {/* Two-column layout */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-5 gap-5"
                    {...fadeIn}
                >
                    {/* ── Left Column (60%) ── */}
                    <div className="lg:col-span-3 flex flex-col gap-5">
                        <MediaGallery property={property} />
                        <PropertyInfoCard property={property} />
                        <PropertyDetails property={property} />
                        <CalendarSync property={property} />
                        <PublicProfile property={property} onVisibilityChange={handleVisibilityChange} />
                    </div>

                    {/* ── Right Column (40%) ── */}
                    <div className="lg:col-span-2">
                        <DetailTabs
                            property={property}
                            notes={notes}
                            onAddNote={handleAddNote}
                            onDeleteNote={handleDeleteNote}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
