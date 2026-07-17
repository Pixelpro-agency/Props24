import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, FileText, FileType, FileSpreadsheet } from 'lucide-react';
import { Select } from '../ui/Select';
import { usePropertiesDb } from '../../hooks/usePropertiesDb';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const downloadFormats = [
    { id: 'pdf', label: 'Scarica in formato Adobe PDF', icon: FileText, color: 'text-red-500' },
    { id: 'docx', label: 'Scarica in formato Word', icon: FileType, color: 'text-blue-500' },
    { id: 'odt', label: 'Scarica in formato Open Office', icon: FileSpreadsheet, color: 'text-indigo-700' },
];

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
    const [selectedProperty, setSelectedProperty] = useState('');
    const [error, setError] = useState('');
    const properties = usePropertiesDb();
    const propertyOptions = properties.map((p) => ({
        value: p.id,
        label: p.title,
    }));

    function handleDownload(format: string) {
        if (!selectedProperty) {
            setError('Per favore scegli una locazione');
            return;
        }
        setError('');
        console.log(`Download ${format} for property ${selectedProperty}`);
        onClose();
    }

    function handleClose() {
        setError('');
        setSelectedProperty('');
        onClose();
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden" role="dialog">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Scarica</h2>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4 space-y-4">
                                <Select
                                    id="tenant_properties"
                                    value={selectedProperty}
                                    onChange={(val) => {
                                        setSelectedProperty(val);
                                        setError('');
                                    }}
                                    options={propertyOptions}
                                    placeholder="Scegli la locazione..."
                                    className="w-full"
                                />

                                {error && (
                                    <p className="text-sm text-red-500">{error}</p>
                                )}

                                <div className="space-y-2">
                                    {downloadFormats.map((fmt) => (
                                        <button
                                            key={fmt.id}
                                            type="button"
                                            onClick={() => handleDownload(fmt.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <fmt.icon className={`w-6 h-6 ${fmt.color}`} />
                                            <span className="text-sm text-gray-700">{fmt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    Chiudi
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
