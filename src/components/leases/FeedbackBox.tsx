import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export function FeedbackBox() {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'empty'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            setStatus('empty');
            return;
        }

        // Simulate API call
        setStatus('success');
        setMessage('');

        // Reset success message after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                    Come possiamo migliorare il sito per offrirti un servizio impeccabile?
                </h3>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <textarea
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                if (status !== 'idle') setStatus('idle');
                            }}
                            placeholder="Mandaci idee e suggerimenti..."
                            className={`w-full h-12 min-h-[48px] px-4 py-3 rounded-lg border text-sm resize-y transition-colors
                                ${status === 'empty' || status === 'error'
                                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/30'
                                    : 'border-gray-200 focus:border-[#72a333] focus:ring-1 focus:ring-[#72a333]'
                                }
                            `}
                        />

                        {/* Status Messages */}
                        <div className="mt-2 text-sm min-h-[20px]">
                            {status === 'success' && (
                                <div className="flex items-center text-[#72a333] font-medium">
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Grazie! Grazie per l'aiuto! Il tuo messaggio è stato inviato.
                                </div>
                            )}
                            {status === 'empty' && (
                                <div className="flex items-center text-red-500 font-medium">
                                    <AlertCircle className="w-4 h-4 mr-1.5" />
                                    Errore! La casella non può essere vuota.
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="flex items-center text-red-500 font-medium">
                                    <AlertCircle className="w-4 h-4 mr-1.5" />
                                    Errore! Inserisci i tuoi suggerimenti, richieste o commenti.
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            icon={Send}
                            className="w-full sm:w-auto mt-0.5"
                        >
                            Invia i tuoi suggerimenti
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
