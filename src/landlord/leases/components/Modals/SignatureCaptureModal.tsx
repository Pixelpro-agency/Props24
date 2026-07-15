import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { SignaturePad } from '../Signature/SignaturePad';
import { useSignature } from '../../hooks/useSignature';

interface SignatureCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    signerName: string;
    signerPhone: string;
    leaseId: number;
}

export const SignatureCaptureModal: React.FC<SignatureCaptureModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    signerName,
    signerPhone,
    leaseId
}) => {
    const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
    const [code, setCode] = useState('');
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const { sendCode, isSendingCode, verifyAndSign, isVerifying } = useSignature();

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSendCode = () => {
        if (!signerPhone) return;

        sendCode(
            { phone: signerPhone, method: channel },
            {
                onSuccess: () => setCooldown(15), // 15 seconds cooldown
            }
        );
    };

    const handleConfirm = () => {
        if (!signatureData || !code || code.length < 4) return;

        verifyAndSign(
            { leaseId, code, signatureBase30: signatureData },
            {
                onSuccess: () => {
                    onSuccess();
                    onClose(); // Parent resets state
                }
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Firma di {signerName}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-6">
                    {/* Step 1: Firma visiva */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">1. Apponi la tua firma sul riquadro</h4>
                        <SignaturePad onSave={setSignatureData} onClear={() => setSignatureData(null)} />
                    </div>

                    {/* Step 2: Verifica OTP */}
                    <div className={`transition-opacity ${!signatureData ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">2. Verifica identità via OTP</h4>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-3">
                                Invia un codice di sicurezza al numero <strong>{signerPhone || 'Non specificato'}</strong> per confermare l'identità del firmatario.
                            </p>

                            <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="sms"
                                        checked={channel === 'sms'}
                                        onChange={() => setChannel('sms')}
                                        className="accent-green-600"
                                    />
                                    <span className="text-sm">SMS</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="whatsapp"
                                        checked={channel === 'whatsapp'}
                                        onChange={() => setChannel('whatsapp')}
                                        className="accent-green-600"
                                    />
                                    <span className="text-sm">WhatsApp</span>
                                </label>
                            </div>

                            <div className="flex items-stretch gap-2">
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={cooldown > 0 || isSendingCode || !signerPhone}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isSendingCode ? 'Invio...' : cooldown > 0 ? `Attendi ${cooldown}s` : 'Richiedi codice'}
                                </button>
                                <input
                                    type="text"
                                    placeholder="Codice a 4 cifre"
                                    value={code}
                                    maxLength={6}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#337ab7]/30 focus:border-[#337ab7] transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!signatureData || code.length < 4 || isVerifying}
                        className="flex items-center gap-2 px-6 py-2 bg-[#5cb85c] hover:bg-[#449d44] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        {isVerifying ? 'Verifica...' : 'Valida Firma Elettronica'}
                    </button>
                </div>
            </div>
        </div>
    );
};
