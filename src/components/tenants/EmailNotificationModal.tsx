import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Eye, EyeOff, Paperclip, Copy } from 'lucide-react';
import { Button } from '../ui/Button';

interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface EmailNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipients: Recipient[];
}

export function EmailNotificationModal({ isOpen, onClose, recipients }: EmailNotificationModalProps) {
    const [sendMethod, setSendMethod] = useState<'email' | 'post'>('email');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [receiveCopy, setReceiveCopy] = useState(false);
    const [attachPdf, setAttachPdf] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
        new Set(recipients.map((r) => r.id)),
    );

    function toggleRecipient(id: string) {
        setSelectedRecipients((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function handleSend() {
        const selected = recipients.filter((r) => selectedRecipients.has(r.id));
        console.log('Send notification:', {
            method: sendMethod,
            subject,
            body,
            recipients: selected,
            receiveCopy,
            attachPdf,
        });
        handleClose();
    }

    function handleClose() {
        setSubject('');
        setBody('');
        setReceiveCopy(false);
        setAttachPdf(false);
        setShowPreview(false);
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
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden" role="dialog">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Notifica</h2>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4 max-h-[500px] overflow-y-auto space-y-4">
                                {/* Send method */}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="sendMethod"
                                            checked={sendMethod === 'email'}
                                            onChange={() => setSendMethod('email')}
                                            className="accent-green-600"
                                        />
                                        Invia per email
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="sendMethod"
                                            checked={sendMethod === 'post'}
                                            onChange={() => setSendMethod('post')}
                                            className="accent-green-600"
                                        />
                                        Invia per posta
                                    </label>
                                </div>

                                {/* Recipients */}
                                {sendMethod === 'email' && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            Destinatari
                                        </h3>
                                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-gray-200 rounded-md p-2">
                                            {recipients.map((r) => (
                                                <label
                                                    key={r.id}
                                                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRecipients.has(r.id)}
                                                        onChange={() => toggleRecipient(r.id)}
                                                        className="w-4 h-4 rounded border-gray-300 accent-green-600"
                                                    />
                                                    <span className="font-medium">{r.name}</span>
                                                    <span className="text-gray-400 text-xs">({r.email})</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                        Oggetto
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Oggetto del messaggio..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                                    />
                                </div>

                                {/* Message body */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                        Messaggio
                                    </label>
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={5}
                                        placeholder="Scrivi il tuo messaggio..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 resize-y"
                                    />
                                </div>

                                {/* Preview */}
                                {showPreview && body && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-gray-50 border border-gray-200 rounded-md p-4"
                                    >
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Anteprima</h4>
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{body}</div>
                                    </motion.div>
                                )}

                                {/* Options */}
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={receiveCopy}
                                            onChange={(e) => setReceiveCopy(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 accent-green-600"
                                        />
                                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                                        Ricevi una copia
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={attachPdf}
                                            onChange={(e) => setAttachPdf(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 accent-green-600"
                                        />
                                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                                        Allegare il file PDF
                                    </label>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                                >
                                    {showPreview ? (
                                        <><EyeOff className="w-4 h-4" /> Nascondi anteprima</>
                                    ) : (
                                        <><Eye className="w-4 h-4" /> Anteprima</>
                                    )}
                                </button>
                                <div className="flex items-center gap-3">
                                    <Button variant="secondary" size="md" onClick={handleClose}>
                                        Annulla
                                    </Button>
                                    <Button variant="primary" size="md" icon={Send} onClick={handleSend}>
                                        Invia
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
