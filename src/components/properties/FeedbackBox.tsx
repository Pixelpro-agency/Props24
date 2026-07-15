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
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
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
