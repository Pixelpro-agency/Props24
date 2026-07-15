import React, { useState } from 'react';
import type { Tenant, Garant } from '../../types/tenant.types';
import { PenTool, CheckCircle, Clock } from 'lucide-react';
import { SignatureStartModal } from '../Modals/SignatureStartModal';
import { SignatureCaptureModal } from '../Modals/SignatureCaptureModal';
import { useSignature } from '../../hooks/useSignature';

interface SignatureSectionProps {
    tenants: Tenant[];
    garants: Garant[];
    leaseId?: number;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({ tenants, garants, leaseId = 1 }) => {
    const [isStartModalOpen, setIsStartModalOpen] = useState(false);
    const [activeSignerModal, setActiveSignerModal] = useState<{ id: string, name: string, phone: string } | null>(null);
    const [processStarted, setProcessStarted] = useState(false);

    // Scaffolding signed state locally for UI demonstration
    const [signedIds, setSignedIds] = useState<Set<string>>(new Set());

    const { startSignature, isStarting } = useSignature();

    const handleStartProcess = () => {
        startSignature(leaseId, {
            onSuccess: () => {
                setProcessStarted(true);
                setIsStartModalOpen(false);
            }
        });
    };

    const handleSignatureSuccess = (signerId: string) => {
        setSignedIds(prev => new Set(prev).add(signerId));
    };

    const renderSignerRow = (id: string, name: string, email: string, phone: string, typeLabel: string) => {
        const isSigned = signedIds.has(id);

        return (
            <div key={id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded uppercase tracking-wider">
                            {typeLabel}
                        </span>
                        <h4 className="font-semibold text-gray-800">{name}</h4>
                    </div>
                    <p className="text-sm text-gray-500">{email} • {phone || 'Nessun telefono'}</p>
                </div>

                <div className="flex items-center gap-4">
                    {isSigned ? (
                        <span className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-full">
                            <CheckCircle className="w-4 h-4" /> Firmato
                        </span>
                    ) : processStarted ? (
                        <button
                            type="button"
                            onClick={() => setActiveSignerModal({ id, name, phone })}
                            className="flex items-center gap-2 px-4 py-2 bg-[#337ab7] hover:bg-[#286090] text-white text-sm font-medium rounded transition-colors"
                        >
                            <PenTool className="w-4 h-4" /> Firma ora
                        </button>
                    ) : (
                        <span className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                            <Clock className="w-4 h-4" /> In attesa
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                    <h3 className="text-lg font-semibold text-[#333]">Firma Elettronica</h3>
                    <p className="text-sm text-gray-500">Gestisci le firme digitali di tutti i soggetti coinvolti nel contratto.</p>
                </div>
                {!processStarted && (
                    <button
                        type="button"
                        onClick={() => setIsStartModalOpen(true)}
                        className="flex items-center gap-2 bg-[#5cb85c] hover:bg-[#449d44] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                        <PenTool className="w-4 h-4" /> Avvia procedura di firma
                    </button>
                )}
            </div>

            {processStarted && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                    <div className="mt-0.5">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">Procedura avviata</h4>
                        <p className="text-sm">Il contratto è stato generato in PDF e bloccato per le modifiche. I firmatari possono ora procedere all'apposizione della firma tramite il tasto "Firma ora".</p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 uppercase tracking-widest px-1">Locatore</h4>
                {renderSignerRow('landlord-1', 'Mario Rossi (Tu)', 'mario.rossi@example.com', '+39 333 1234567', 'Locatore')}

                {tenants.length > 0 && (
                    <>
                        <h4 className="text-sm font-medium text-gray-700 uppercase tracking-widest px-1 mt-6">Inquilini</h4>
                        {tenants.map(t => renderSignerRow(
                            `tenant-${t.TenantID}`,
                            t.TenantType === 'company' ? t.TenantCompanyName || '' : `${t.TenantFirstName} ${t.TenantLastName}`,
                            t.TenantEmail,
                            t.TenantMobilePhone || '',
                            'Inquilino'
                        ))}
                    </>
                )}

                {garants.length > 0 && (
                    <>
                        <h4 className="text-sm font-medium text-gray-700 uppercase tracking-widest px-1 mt-6">Garanti</h4>
                        {garants.map(g => renderSignerRow(
                            `garant-${g.ContactID}`,
                            g.ContactType === 'company' ? g.ContactCompanyName || '' : `${g.ContactFirstName} ${g.ContactLastName}`,
                            g.ContactEmail,
                            g.ContactMobilePhone || '',
                            'Garante'
                        ))}
                    </>
                )}
            </div>

            <SignatureStartModal
                isOpen={isStartModalOpen}
                onClose={() => setIsStartModalOpen(false)}
                onConfirm={handleStartProcess}
                isLoading={isStarting}
            />

            {activeSignerModal && (
                <SignatureCaptureModal
                    isOpen={!!activeSignerModal}
                    onClose={() => setActiveSignerModal(null)}
                    onSuccess={() => handleSignatureSuccess(activeSignerModal.id)}
                    signerName={activeSignerModal.name}
                    signerPhone={activeSignerModal.phone}
                    leaseId={leaseId}
                />
            )}
        </div>
    );
};
