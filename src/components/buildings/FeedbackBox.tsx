import { useState } from 'react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';

type AlertType = 'success' | 'error' | null;

export function FeedbackBox() {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<AlertType>(null);

    async function handleSubmit() {
        if (!message.trim()) {
            setAlert('error');
            return;
        }

        setLoading(true);
        setAlert(null);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setLoading(false);
        setAlert('success');
        setMessage('');

        // Auto-hide success after 4 seconds
        setTimeout(() => setAlert(null), 4000);
    }

    return (
        <div className="relative mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            {/* Loading overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg"
                    >
                        <div className="flex items-center gap-2 text-green-600">
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-sm font-medium">Caricamento…</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <h3 className="text-base text-gray-600 mb-4">
                Come possiamo migliorare il sito per offrirti un servizio impeccabile?
            </h3>

            <textarea
                value={message}
                onChange={(e) => {
                    setMessage(e.target.value);
                    if (alert === 'error') setAlert(null);
                }}
                placeholder="Mandaci idee e suggerimenti..."
                rows={5}
                className="w-full border border-gray-200 rounded-md p-3 text-sm text-gray-700 placeholder:text-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors duration-200"
            />

            <Button
                variant="secondary"
                size="md"
                onClick={handleSubmit}
                loading={loading}
                className="mt-3"
            >
                Invia i tuoi suggerimenti
            </Button>

            {/* Alerts */}
            <AnimatePresence>
                {alert === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700"
                    >
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        Grazie per l'aiuto! Il tuo messaggio è stato inviato.
                    </motion.div>
                )}
                {alert === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Inserisci i tuoi suggerimenti, richieste o commenti. La casella non può essere vuota.
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
