import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    MapPin,
    Maximize2,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PropertyDetail } from '../../types/propertyDetail';

type GalleryTab = 'foto' | 'mappa';

interface MediaGalleryProps {
    property: PropertyDetail;
}

export function MediaGallery({ property }: MediaGalleryProps) {
    const [activeTab, setActiveTab] = useState<GalleryTab>('foto');
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const photos = property.media.photos;
    const hasPhotos = photos.length > 0;

    const tabs: { id: GalleryTab; label: string; icon: React.ReactNode }[] = [
        { id: 'foto', label: 'Foto', icon: <Camera className="w-4 h-4" /> },
        { id: 'mappa', label: 'Mappa', icon: <MapPin className="w-4 h-4" /> },
    ];

    function handlePrev() {
        setCurrentPhoto((p) => (p > 0 ? p - 1 : photos.length - 1));
    }

    function handleNext() {
        setCurrentPhoto((p) => (p < photos.length - 1 ? p + 1 : 0));
    }

    /* ── Viewer content based on active tab ── */
    function renderContent(inFullscreen = false) {
        const height = inFullscreen ? 'h-[80vh]' : 'h-[320px] sm:h-[380px]';

        if (activeTab === 'foto') {
            if (!hasPhotos) {
                return (
                    <div className={clsx('bg-[#f5f5f5] flex flex-col items-center justify-center', height)}>
                        <Camera className="w-16 h-16 text-gray-300 mb-2" />
                        <span className="text-gray-400 text-sm">Nessuna foto disponibile</span>
                    </div>
                );
            }
            return (
                <div className={clsx('relative bg-[#f5f5f5] flex items-center justify-center', height)}>
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentPhoto}
                            src={photos[currentPhoto]}
                            alt={`Foto ${currentPhoto + 1}`}
                            className="max-h-full max-w-full object-contain"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    </AnimatePresence>

                    {/* Navigation arrows */}
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition-colors cursor-pointer"
                                aria-label="Foto precedente"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition-colors cursor-pointer"
                                aria-label="Foto successiva"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </>
                    )}

                    {/* Counter */}
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {currentPhoto + 1} di {photos.length}
                    </div>
                </div>
            );
        }

        // Mappa (Google Maps embed)
        const fullAddress = `${property.address.street}, ${property.address.postalCode} ${property.address.city}, ${property.address.country}`;
        const encodedAddress = encodeURIComponent(fullAddress);

        return (
            <div className={clsx('bg-[#f5f5f5] overflow-hidden', height)}>
                <iframe
                    title="Google Maps"
                    src={`https://maps.google.com/maps?q=${encodedAddress}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
        );
    }

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700">Informazioni</h2>
                    {!isFullscreen && (
                        <button
                            onClick={() => setIsFullscreen(true)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                            A schermo intero
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="relative">
                    {renderContent()}

                    {/* Counter for no-photo state */}
                    {!hasPhotos && activeTab === 'foto' && (
                        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            1 di 1
                        </div>
                    )}
                </div>

                {/* Tab bar */}
                <div className="flex border-t border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer',
                                activeTab === tab.id
                                    ? 'text-[#72a333] border-t-2 border-[#72a333] -mt-px bg-green-50/30'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Fullscreen Overlay ── */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Close button */}
                        <div className="flex justify-end p-4">
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="text-white hover:text-gray-300 transition-colors cursor-pointer"
                                aria-label="Chiudi"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Fullscreen content */}
                        <div className="flex-1 flex items-center justify-center px-4">
                            <div className="w-full max-w-5xl">
                                {renderContent(true)}
                            </div>
                        </div>

                        {/* Tab bar in fullscreen */}
                        <div className="flex justify-center gap-4 p-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                                        activeTab === tab.id
                                            ? 'bg-white text-[#72a333]'
                                            : 'text-white/70 hover:text-white hover:bg-white/10',
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
