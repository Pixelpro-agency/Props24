import { useState } from 'react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type AlertType = 'success' | 'error' | 'empty' | null;

export function FeedbackBox() {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<AlertType>(null);

    async function handleSubmit() {
        // Empty validation
        if (!message.trim()) {
            setAlert('empty');
            return;
        }

        setLoading(true);
        setAlert(null);

        // Simulate AJAX POST to /landlord/contact/?action=avis
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setLoading(false);
        setAlert('success');
        setMessage('');

        // Auto-hide success after 4 seconds
        setTimeout(() => setAlert(null), 4000);
    }

    return (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 relative" id="legendsuggest">
            {/* Preloader */}
            {loading && (
                <div className="absolute top-4 right-4">
                    <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                </div>
            )}

            <h3 className="text-base text-gray-600 mb-4">
                Come possiamo migliorare il sito per offrirti un servizio impeccabile?
            </h3>

            <form id="CommentsForm" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <textarea
                    id="contact_message"
                    name="comments"
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        if (alert === 'error' || alert === 'empty') setAlert(null);
                    }}
                    placeholder="Mandaci idee e suggerimenti..."
                    rows={5}
                    cols={50}
                    className="w-[98%] border border-gray-200 rounded-md p-3 text-sm text-gray-700 placeholder:text-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors duration-200"
                />

                {/* Hidden field with current page URL */}
                <input type="hidden" name="page" value={typeof window !== 'undefined' ? window.location.href : ''} />

                <Button
                    variant="secondary"
                    size="md"
                    onClick={handleSubmit}
                    loading={loading}
                    className="mt-3"
                >
                    Invia i tuoi suggerimenti
                </Button>
            </form>

            {/* Alert System — 3 states */}
            <AnimatePresence>
                {alert === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700"
                    >
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span><strong>Grazie!</strong> Grazie per l'aiuto! Il tuo messaggio è stato inviato.</span>
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
                        <span><strong>Errore!</strong> Inserisci i tuoi suggerimenti, richieste o commenti.</span>
                    </motion.div>
                )}
                {alert === 'empty' && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span><strong>Errore!</strong> Inserisci i tuoi suggerimenti, richieste o commenti. La casella non può essere vuota.</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
