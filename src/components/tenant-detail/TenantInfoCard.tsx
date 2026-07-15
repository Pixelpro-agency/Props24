import { Copy } from 'lucide-react';
import type { TenantDetail } from '../../types/tenantDetail';

interface TenantInfoCardProps {
    tenant: TenantDetail;
    onInvite: () => void;
    onCopyLink: () => void;
}

export function TenantInfoCard({ tenant, onInvite, onCopyLink }: TenantInfoCardProps) {

    // Helper Avatar
    const getInitials = () => {
        if (tenant.type === 'company' && tenant.companyName) {
            return tenant.companyName.substring(0, 2).toUpperCase();
        }
        if (tenant.firstName && tenant.lastName) {
            return `${tenant.firstName[0]}${tenant.lastName[0]}`.toUpperCase();
        }
        return '??';
    };

    const getFullName = () => {
        if (tenant.type === 'company') return tenant.companyName || 'Azienda';
        return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            {/* Sezione Anagrafica / Header Info */}
            <div className="p-6 border-b border-gray-100 mb-2">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {tenant.avatarUrl ? (
                        <img src={tenant.avatarUrl} alt={getFullName()} className="w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-gray-50" />
                    ) : (
                        <div
                            className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center text-xl font-bold text-white shadow-sm"
                            style={{ backgroundColor: tenant.avatarColor || '#ee8c0e' }}
                        >
                            {getInitials()}
                        </div>
                    )}

                    {/* Dati Principali */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-gray-900 mb-1 truncate">
                            {getFullName()}
                        </h2>
                        <div className="text-sm text-gray-600 mb-1 space-y-0.5">
                            {tenant.type === 'person' ? (
                                <>
                                    {tenant.fiscalCode && <div>Codice fiscale: <span className="text-gray-800">{tenant.fiscalCode.toUpperCase()}</span></div>}
                                    {tenant.nationality && <div>Nazionalità: {tenant.nationality}</div>}
                                    {tenant.birthDate && <div>Data e luogo di nascita: {tenant.birthDate} {tenant.birthPlace}</div>}
                                </>
                            ) : (
                                <>
                                    {tenant.vatNumber && <div>Partita IVA: <span className="text-gray-800">{tenant.vatNumber}</span></div>}
                                    {tenant.siret && <div>Codice univoco: {tenant.siret}</div>}
                                    {tenant.capital && <div>Capitale sociale: {tenant.capital}</div>}
                                </>
                            )}
                        </div>

                        {/* Contatti diretti */}
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                            {(tenant.mobilePhone || tenant.phone) && (
                                <div className="flex items-center gap-2">
                                    <span className="w-16 flex-shrink-0 text-gray-500">Cellulare</span>
                                    <a href={`tel:${tenant.mobilePhone || tenant.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                        {tenant.mobilePhone || tenant.phone}
                                    </a>
                                </div>
                            )}
                            {tenant.email && (
                                <div className="flex items-center gap-2">
                                    <span className="w-16 flex-shrink-0 text-gray-500">Email</span>
                                    <a href={`mailto:${tenant.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                        {tenant.email}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Login Status */}
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-sm text-gray-700">Log in</span>
                            {tenant.loginStatus?.status === 'active' && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">Attivo</span>
                            )}
                            {tenant.loginStatus?.status === 'pending_invitation' && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Invito inviato</span>
                            )}
                            {(tenant.loginStatus?.status === 'inactive' || !tenant.loginStatus?.status) && (
                                <button
                                    onClick={onInvite}
                                    className="px-2 py-0.5 bg-[#72a333] hover:bg-[#638e2c] text-white text-xs font-medium rounded transition-colors shadow-sm"
                                >
                                    INVITA
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sezione Indirizzi */}
            <div className="p-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2 font-semibold">Proprietà affittata</h3>
                    {tenant.addresses.rentedProperty?.displayName ? (
                        <div className="text-sm text-gray-600 space-y-0.5">
                            <div>{tenant.addresses.rentedProperty.displayName}</div>
                            {tenant.addresses.rentedProperty.street && <div>{tenant.addresses.rentedProperty.street}</div>}
                            {(tenant.addresses.rentedProperty.zip || tenant.addresses.rentedProperty.city) && (
                                <div>{`${tenant.addresses.rentedProperty.zip || ''} ${tenant.addresses.rentedProperty.city || ''}`.trim()}</div>
                            )}
                            {tenant.addresses.rentedProperty.country && <div>{tenant.addresses.rentedProperty.country}</div>}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Nessuna proprietà assegnata</p>
                    )}
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2 font-semibold">Indirizzo dell'inquilino</h3>
                    {tenant.addresses.tenantAddress?.street ? (
                        <div className="text-sm text-gray-600 space-y-0.5">
                            <div>{tenant.addresses.tenantAddress.street}</div>
                            {(tenant.addresses.tenantAddress.zip || tenant.addresses.tenantAddress.city) && (
                                <div>{`${tenant.addresses.tenantAddress.zip || ''} ${tenant.addresses.tenantAddress.city || ''}`.trim()}</div>
                            )}
                            {tenant.addresses.tenantAddress.country && <div>{tenant.addresses.tenantAddress.country}</div>}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Nessuna informazione</p>
                    )}
                </div>
            </div>

            {/* Sezione Lavoreo */}
            <div className="p-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2 font-semibold">Situazione professionale</h3>
                    {tenant.employment?.profession ? (
                        <div className="text-sm text-gray-600">
                            Professione locatario <span className="ml-1 text-gray-800">{tenant.employment.profession}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Nessuna informazione</p>
                    )}
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2 font-semibold">Indirizzo di lavoro</h3>
                    {tenant.employment?.workAddress?.street ? (
                        <div className="text-sm text-gray-600 space-y-0.5">
                            <div>{tenant.employment.workAddress.street}</div>
                            {(tenant.employment.workAddress.zip || tenant.employment.workAddress.city) && (
                                <div>{`${tenant.employment.workAddress.zip || ''} ${tenant.employment.workAddress.city || ''}`.trim()}</div>
                            )}
                            {tenant.employment.workAddress.country && <div>{tenant.employment.workAddress.country}</div>}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Nessuna informazione</p>
                    )}
                </div>
            </div>

            {/* Finanze & Note base */}
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-800 mb-2 font-semibold">Banca</h3>
                {tenant.bankName || tenant.bankIBAN ? (
                    <div className="text-sm text-gray-600">
                        {tenant.bankName && <div>{tenant.bankName}</div>}
                        {tenant.bankIBAN && <div>IBAN: {tenant.bankIBAN}</div>}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Nessuna informazione</p>
                )}
            </div>

            <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-800 mb-2 font-semibold">Note</h3>
                {tenant.notes ? (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{tenant.notes}</p>
                ) : (
                    <p className="text-sm text-gray-500">Nessuna informazione</p>
                )}
            </div>

            {/* Link di invito */}
            {tenant.inviteLink && (
                <div className="p-6 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1 font-semibold">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-700" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        Link di invito.
                    </h3>

                    <div className="flex items-center gap-2 mt-2 mb-3">
                        <div className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                            {tenant.inviteLink.url}
                        </div>
                        <button
                            onClick={onCopyLink}
                            className="p-1.5 border border-gray-300 bg-white rounded-md text-gray-600 hover:bg-gray-50 flex-shrink-0 transition-colors"
                            title="Copia link"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">
                        {tenant.inviteLink.description}
                    </p>
                </div>
            )}
        </div>
    );
}
