import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PremiumBanner() {
    const [visible, setVisible] = useState(true);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative flex items-center justify-center gap-3 px-5 py-3 mb-5 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 text-sm"
                >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400 flex-shrink-0" />
                    <span className="text-amber-800">
                        Hai bisogno di un abbonamento premium?
                    </span>
                    <a
                        href="#"
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200"
                    >
                        Acquista un abbonamento Premium
                    </a>
                    <button
                        onClick={() => setVisible(false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-amber-400 hover:text-amber-600 transition-colors"
                        aria-label="Chiudi banner"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
