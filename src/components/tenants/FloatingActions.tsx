import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Archive, MessageCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface FloatingActionsProps {
    selectedCount: number;
    onDelete: () => void;
    onArchive: () => void;
    onMessage: () => void;
}

export function FloatingActions({ selectedCount, onDelete, onArchive, onMessage }: FloatingActionsProps) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg border border-gray-200 rounded-lg px-5 py-3 flex items-center gap-4"
                >
                    {/* Label + count */}
                    <span className="text-sm font-medium text-gray-700">
                        Azioni
                        <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">
                            {selectedCount}
                        </span>
                    </span>

                    <div className="w-px h-6 bg-gray-200" />

                    {/* Delete */}
                    <Button variant="danger" size="sm" icon={Trash2} onClick={onDelete}>
                        Elimina
                    </Button>

                    {/* Archive */}
                    <Button variant="secondary" size="sm" icon={Archive} onClick={onArchive}>
                        Archivia
                    </Button>

                    {/* Message */}
                    <Button variant="secondary" size="sm" icon={MessageCircle} onClick={onMessage}>
                        Messaggio
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
