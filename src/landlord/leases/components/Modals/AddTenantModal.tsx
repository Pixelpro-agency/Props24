import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { tenantApi } from '../../services/tenantApi';
import type { TenantFormData, Tenant } from '../../types/tenant.types';
import { X, UserPlus, Building2, User } from 'lucide-react';

interface AddTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTenantAdded: (tenant: Tenant) => void;
    existingTenantIds: number[];
}

const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#337ab7]/30 focus:border-[#337ab7] transition-colors";

export const AddTenantModal: React.FC<AddTenantModalProps> = ({ isOpen, onClose, onTenantAdded, existingTenantIds }) => {
    const [mode, setMode] = useState<'select' | 'create'>('create');
    const [emailWarning, setEmailWarning] = useState('');
    const [nameWarning, setNameWarning] = useState('');

    const { data: existingTenants = [] } = useQuery({
        queryKey: ['tenants', 'list'],
        queryFn: tenantApi.getExistingTenants,
        enabled: isOpen
    });

    const form = useForm<TenantFormData>({
        defaultValues: {
            TenantType: 'person',
            TenantFirstName: '',
            TenantLastName: '',
            TenantCompanyName: '',
            TenantEmail: '',
            TenantMobilePhone: '',
            TenantEmailIgnoreUnique: false
        }
    });

    const { register, watch, handleSubmit, reset } = form;
    const tenantType = watch('TenantType');

    const createMutation = useMutation({
        mutationFn: tenantApi.createTenant,
        onSuccess: (tenant) => {
            onTenantAdded(tenant);
            reset();
            onClose();
        }
    });

    // Duplicate email check
    const handleEmailBlur = async (email: string) => {
        if (!email) { setEmailWarning(''); return; }
        const exists = await tenantApi.checkEmail(email);
        setEmailWarning(exists ? 'Questa email è già associata a un altro inquilino.' : '');
    };

    // Duplicate name check
    const handleNameBlur = async () => {
        const firstName = form.getValues('TenantFirstName') || '';
        const lastName = form.getValues('TenantLastName') || '';
        if (!firstName || !lastName) { setNameWarning(''); return; }
        const exists = await tenantApi.checkNames(firstName, lastName);
        setNameWarning(exists ? 'Un inquilino con questo nome esiste già.' : '');
    };

    const onSubmitForm = handleSubmit((data) => {
        createMutation.mutate(data);
    });

    const handleSelectExisting = (tenant: Tenant) => {
        onTenantAdded(tenant);
        onClose();
    };

    if (!isOpen) return null;

    const availableTenants = existingTenants.filter(t => !existingTenantIds.includes(t.TenantID));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <UserPlus className="w-5 h-5" /> Aggiungi Inquilino
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div className="px-6 py-3 border-b border-gray-100 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('create')}
                        className={`px-4 py-2 text-sm font-medium rounded transition-colors ${mode === 'create' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Nuovo
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('select')}
                        className={`px-4 py-2 text-sm font-medium rounded transition-colors ${mode === 'select' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Esistente
                    </button>
                </div>

                {mode === 'select' ? (
                    <div className="px-6 py-4">
                        {availableTenants.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">Nessun inquilino disponibile da selezionare.</p>
                        ) : (
                            <div className="space-y-2">
                                {availableTenants.map((t) => (
                                    <button
                                        key={t.TenantID}
                                        type="button"
                                        onClick={() => handleSelectExisting(t)}
                                        className="w-full flex items-center gap-3 p-3 rounded border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                            {t.TenantType === 'company' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {t.TenantType === 'company' ? t.TenantCompanyName : `${t.TenantFirstName} ${t.TenantLastName}`}
                                            </p>
                                            <p className="text-xs text-gray-400">{t.TenantEmail}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={onSubmitForm} className="px-6 py-4 space-y-4">
                        {/* Type Toggle */}
                        <div className="flex items-center gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="person" {...register('TenantType')} className="accent-green-600" />
                                <User className="w-4 h-4" /> <span className="text-sm">Persona</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="company" {...register('TenantType')} className="accent-green-600" />
                                <Building2 className="w-4 h-4" /> <span className="text-sm">Società</span>
                            </label>
                        </div>

                        {tenantType === 'person' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Nome</label>
                                    <input type="text" {...register('TenantFirstName')} onBlur={handleNameBlur} className={inputClass} placeholder="Nome" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Cognome</label>
                                    <input type="text" {...register('TenantLastName')} onBlur={handleNameBlur} className={inputClass} placeholder="Cognome" />
                                </div>
                                {nameWarning && <p className="col-span-2 text-xs text-orange-500">{nameWarning}</p>}
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Ragione sociale</label>
                                <input type="text" {...register('TenantCompanyName')} className={inputClass} placeholder="Ragione sociale" />
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                            <input
                                type="email"
                                {...register('TenantEmail')}
                                onBlur={(e) => handleEmailBlur(e.target.value)}
                                className={inputClass}
                                placeholder="email@esempio.it"
                            />
                            {emailWarning && (
                                <div className="mt-1">
                                    <p className="text-xs text-orange-500">{emailWarning}</p>
                                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                                        <input type="checkbox" {...register('TenantEmailIgnoreUnique')} className="accent-green-600" />
                                        <span className="text-xs text-gray-500">Ignora e continua comunque</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Telefono</label>
                            <input type="tel" {...register('TenantMobilePhone')} className={inputClass} placeholder="+39 333 123 4567" />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="px-6 py-2 bg-[#5cb85c] hover:bg-[#449d44] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Salvataggio...' : 'Aggiungi inquilino'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
