import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Archive, MessageCircle, XCircle, CheckCircle } from 'lucide-react';

interface FloatingActionsProps {
    selectedCount: number;
    onDelete: () => void;
    onDeactivate: () => void;
    onActivate: () => void;
    onArchive: () => void;
    onMessage: () => void;
}

export function FloatingActions({
    selectedCount,
    onDelete,
    onDeactivate,
    onActivate,
    onArchive,
    onMessage
}: FloatingActionsProps) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 50, x: '-50%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-6 left-1/2 z-50 bg-gray-900 text-white shadow-2xl rounded-full px-4 py-2 flex items-center gap-2"
                >
                    {/* Count badge */}
                    <div className="flex items-center gap-3 pr-2 border-r border-gray-700">
                        <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-[#72a333] text-white text-xs font-bold">
                            {selectedCount}
                        </span>
                        <span className="text-sm font-medium mr-1 select-none">
                            selezionate
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center px-1">
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-full text-gray-300 hover:text-red-400 hover:bg-gray-800 transition-colors group relative"
                            title="Elimina"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span className="absolute -top-10 left-1/2 -px-2 py-1 -translate-x-1/2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Elimina
                            </span>
                        </button>

                        <button
                            onClick={onDeactivate}
                            className="p-2 rounded-full text-gray-300 hover:text-orange-400 hover:bg-gray-800 transition-colors group relative"
                            title="Disattiva"
                        >
                            <XCircle className="w-5 h-5" />
                            <span className="absolute -top-10 left-1/2 -transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Disattiva
                            </span>
                        </button>

                        <button
                            onClick={onActivate}
                            className="p-2 rounded-full text-gray-300 hover:text-[#72a333] hover:bg-gray-800 transition-colors group relative"
                            title="Attiva"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span className="absolute -top-10 left-1/2 -transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Attiva
                            </span>
                        </button>

                        <button
                            onClick={onArchive}
                            className="p-2 rounded-full text-gray-300 hover:text-blue-400 hover:bg-gray-800 transition-colors group relative"
                            title="Archivia"
                        >
                            <Archive className="w-5 h-5" />
                            <span className="absolute -top-10 left-1/2 -transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Archivia
                            </span>
                        </button>

                        <div className="w-px h-6 bg-gray-700 mx-2" />

                        <button
                            onClick={onMessage}
                            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800 transition-colors group relative"
                            title="Invia messaggio"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="absolute -top-10 left-1/2 -transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Invia messaggio
                            </span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
