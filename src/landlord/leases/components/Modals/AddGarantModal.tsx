import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { tenantApi } from '../../services/tenantApi';
import type { GarantFormData, Garant } from '../../types/tenant.types';
import { X, ShieldCheck, Building2, User, MapPin } from 'lucide-react';
import { useGooglePlaces, type ParsedAddress } from '../../hooks/useGooglePlaces';

interface AddGarantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGarantAdded: (garant: Garant) => void;
    existingGarantIds: number[];
}

const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#337ab7]/30 focus:border-[#337ab7] transition-colors";

export const AddGarantModal: React.FC<AddGarantModalProps> = ({ isOpen, onClose, onGarantAdded, existingGarantIds }) => {
    const [mode, setMode] = useState<'select' | 'create'>('create');
    const [addressText, setAddressText] = useState('');

    const { data: existingGarants = [] } = useQuery({
        queryKey: ['garants', 'list'],
        queryFn: tenantApi.getGarants,
        enabled: isOpen
    });

    const form = useForm<GarantFormData>({
        defaultValues: {
            ContactType: 'person',
            ContactFirstName: '',
            ContactLastName: '',
            ContactCompanyName: '',
            ContactEmail: '',
            ContactMobilePhone: '',
            ContactAddress: '',
            ContactCity: '',
            ContactZip: '',
            ContactCountry: '',
        }
    });

    const { register, watch, handleSubmit, reset, setValue } = form;
    const contactType = watch('ContactType');

    // Google Places autocomplete
    const handleAddressSelected = useCallback((parsed: ParsedAddress) => {
        const street = [parsed.route, parsed.streetNumber].filter(Boolean).join(' ');
        setValue('ContactAddress', street);
        setValue('ContactCity', parsed.locality);
        setValue('ContactZip', parsed.postalCode);
        setValue('ContactCountry', parsed.country);
        setAddressText(parsed.fullAddress);
    }, [setValue]);

    const { inputRef: addressInputRef } = useGooglePlaces(handleAddressSelected);

    const createMutation = useMutation({
        mutationFn: tenantApi.createGarant,
        onSuccess: (garant) => {
            onGarantAdded(garant);
            reset();
            setAddressText('');
            onClose();
        }
    });

    const onSubmitForm = handleSubmit((data) => {
        createMutation.mutate(data);
    });

    const handleSelectExisting = (garant: Garant) => {
        onGarantAdded(garant);
        onClose();
    };

    if (!isOpen) return null;

    const availableGarants = existingGarants.filter(g => !existingGarantIds.includes(g.ContactID));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Aggiungi Garante
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
                        {availableGarants.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">Nessun garante disponibile da selezionare.</p>
                        ) : (
                            <div className="space-y-2">
                                {availableGarants.map((g) => (
                                    <button
                                        key={g.ContactID}
                                        type="button"
                                        onClick={() => handleSelectExisting(g)}
                                        className="w-full flex items-center gap-3 p-3 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                            {g.ContactType === 'company' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {g.ContactType === 'company' ? g.ContactCompanyName : `${g.ContactFirstName} ${g.ContactLastName}`}
                                            </p>
                                            <p className="text-xs text-gray-400">{g.ContactEmail}</p>
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
                                <input type="radio" value="person" {...register('ContactType')} className="accent-green-600" />
                                <User className="w-4 h-4" /> <span className="text-sm">Persona</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="company" {...register('ContactType')} className="accent-green-600" />
                                <Building2 className="w-4 h-4" /> <span className="text-sm">Società</span>
                            </label>
                        </div>

                        {contactType === 'person' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Nome</label>
                                    <input type="text" {...register('ContactFirstName')} className={inputClass} placeholder="Nome" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Cognome</label>
                                    <input type="text" {...register('ContactLastName')} className={inputClass} placeholder="Cognome" />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Ragione sociale</label>
                                <input type="text" {...register('ContactCompanyName')} className={inputClass} placeholder="Ragione sociale" />
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                            <input type="email" {...register('ContactEmail')} className={inputClass} placeholder="email@esempio.it" />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Telefono</label>
                            <input type="tel" {...register('ContactMobilePhone')} className={inputClass} placeholder="+39 333 123 4567" />
                        </div>

                        {/* Indirizzo con Google Places Autocomplete */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Indirizzo
                            </label>
                            <input
                                ref={addressInputRef}
                                type="text"
                                value={addressText}
                                onChange={(e) => {
                                    setAddressText(e.target.value);
                                    setValue('ContactAddress', e.target.value);
                                }}
                                className={inputClass}
                                placeholder="Inizia a digitare l'indirizzo..."
                                autoComplete="off"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <label className="text-xs font-medium text-gray-500 mb-1 block">CAP</label>
                                <input type="text" {...register('ContactZip')} className={inputClass} placeholder="00100" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Città</label>
                                <input type="text" {...register('ContactCity')} className={inputClass} placeholder="Roma" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Paese</label>
                                <input type="text" {...register('ContactCountry')} className={inputClass} placeholder="Italia" />
                            </div>
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
                                {createMutation.isPending ? 'Salvataggio...' : 'Aggiungi garante'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
