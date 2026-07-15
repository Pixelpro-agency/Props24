import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signatureDataUrl: string) => void;
    onClear?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear }) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
        if (onClear) onClear();
    };

    const handleEnd = () => {
        setIsEmpty(sigCanvas.current?.isEmpty() ?? true);
    };

    const save = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            // Get base64 data URL
            const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            onSave(dataUrl);
        }
    };

    return (
        <div className="w-full">
            <div className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden relative" style={{ height: '200px' }}>
                <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                        className: 'w-full h-full cursor-crosshair'
                    }}
                    backgroundColor="rgb(249, 250, 251)" // match bg-gray-50
                    penColor="black"
                    onEnd={handleEnd}
                />

                {/* Placeholder text visible only when empty */}
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
                        Firma qui sopra
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-3">
                <button
                    type="button"
                    onClick={clear}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                    <Eraser className="w-4 h-4" /> Cancella firma
                </button>
                <button
                    type="button"
                    onClick={save}
                    disabled={isEmpty}
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Check className="w-4 h-4" /> Conferma firma
                </button>
            </div>
        </div>
    );
};
