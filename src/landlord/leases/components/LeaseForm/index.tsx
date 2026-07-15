import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LeaseTabs } from './LeaseTabs';
import { propertyApi } from '../../services/propertyApi';
import { leaseApi } from '../../services/leaseApi';
import type { LeaseFormData, LeaseType as LeaseTypeInterface } from '../../types/lease.types';
import type { Property } from '../../types/property.types';
import type { Tenant, Garant } from '../../types/tenant.types';
import { recalculateLeaseRent, calculateDuration, proposeEndDate, calculateFirstPayment } from '../../utils/calculations';
import { Plus, Trash2, Calculator, UserPlus, ShieldCheck, X, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import { AddTenantModal } from '../Modals/AddTenantModal';
import { AddGarantModal } from '../Modals/AddGarantModal';
import { SignatureSection } from '../Signature/SignatureSection';
import { DocumentSection } from '../Documents/DocumentSection';
import { ChangePropertyModal } from '../Modals/ChangePropertyModal';
import { UpgradeModal } from '../Modals/UpgradeModal';

// ─── Styled form helpers ───────────────────────────────────
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-lg font-semibold text-[#333] mb-4 pb-2 border-b border-gray-200">{children}</h3>
);

const FormRow: React.FC<{ label: string; required?: boolean; help?: string; children: React.ReactNode }> = ({
    label, required, help, children
}) => (
    <div className="flex flex-col md:flex-row md:items-start gap-2 mb-5">
        <label className="md:w-48 shrink-0 text-sm font-medium text-gray-600 pt-2">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="flex-1">
            {children}
            {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
        </div>
    </div>
);

const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#337ab7]/30 focus:border-[#337ab7] transition-colors";
const selectClass = inputClass;

// ─── Main LeaseForm ────────────────────────────────────────
export const LeaseForm: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
    const [selectedTenants, setSelectedTenants] = useState<Tenant[]>([]);
    const [isGarantModalOpen, setIsGarantModalOpen] = useState(false);
    const [isChangePropertyModalOpen, setIsChangePropertyModalOpen] = useState(false);
    const [pendingPropertyId, setPendingPropertyId] = useState<string | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [selectedGarants, setSelectedGarants] = useState<Garant[]>([]);

    // Autosave state
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // API queries
    const { data: properties = [] } = useQuery({
        queryKey: ['properties', 'list'],
        queryFn: propertyApi.getPropertiesList
    });

    const { data: leaseTypes = [] } = useQuery({
        queryKey: ['leases', 'types'],
        queryFn: leaseApi.getLeaseTypes
    });

    // Form
    const form = useForm<LeaseFormData>({
        defaultValues: {
            PropertyID: '',
            LeaseType: '',
            LeaseIdentificativo: 'Nuova locazione',
            LeaseNumeroRegistrazione: '',
            LeaseStartDate: '',
            LeaseEndDate: '',
            LeaseRinnovoTacito: true,
            LeaseBillingPeriod: 'monthly',
            LeasePaymentTiming: 'anticipato',
            LeasePaymentMethod: '',
            LeasePaymentDay: 1,
            LeaseRentHC: 0,
            LeaseMaintenance: 0,
            LeaseSpeseType: 'anticipo',
            LeaseMonthlyAmount: 0,
            LeaseVatType: '0',
            LeaseVatPercent: 0,
            LeaseFirstBill: false,
            LeaseFirstBillEndDate: '',
            LeaseFirstBillAmount: 0,
            LeaseFirstBillCharges: 0,
            PaymentItems: [],
            LeaseDeposit: 0,
            LeaseDepositType: 'trattenuto',
            LeaseDepositDate: '',
            LeasePrepaidRent: 0,
            LeaseUpdateType: 'nessuno',
            LeaseUpdateIndex: '',
            LeaseUpdateAuto: false,
            LeaseUpdateDateType: 'anniversario',
            LeaseUpdateDateSpecific: '',
            LeaseDraft: 1
        }
    });

    const { register, watch, setValue, control } = form;

    // PaymentItems dynamic list
    const { fields: paymentItems, append: addPaymentItem, remove: removePaymentItem } = useFieldArray({
        control,
        name: 'PaymentItems'
    });

    // Watchers
    const selectedPropertyId = watch('PropertyID');
    const selectedLeaseType = watch('LeaseType');
    const rentHC = watch('LeaseRentHC');
    const maintenance = watch('LeaseMaintenance');
    const startDate = watch('LeaseStartDate');
    const endDate = watch('LeaseEndDate');
    const firstBillEnabled = watch('LeaseFirstBill');
    // const speseType = watch('LeaseSpeseType'); // Will be used for conditional logic
    const vatType = watch('LeaseVatType');

    // Get selected lease type object
    const selectedLeaseTypeObj = useMemo(() =>
        leaseTypes.find((lt: LeaseTypeInterface) => lt.LeaseTypeID === selectedLeaseType),
        [leaseTypes, selectedLeaseType]
    );

    // ─── Auto-calculate total rent ─────────
    useEffect(() => {
        const total = recalculateLeaseRent(rentHC || 0, maintenance || 0);
        setValue('LeaseMonthlyAmount', total);
    }, [rentHC, maintenance, setValue]);

    // ─── Auto-calculate duration text ─────
    const durationText = useMemo(() => {
        return calculateDuration(startDate, endDate || '');
    }, [startDate, endDate]);

    // ─── Auto-propose end date on lease type change ─────
    useEffect(() => {
        if (selectedLeaseTypeObj && startDate) {
            const proposed = proposeEndDate(startDate, selectedLeaseTypeObj.LeaseTypeDuration);
            if (proposed) setValue('LeaseEndDate', proposed);
        }
    }, [selectedLeaseType, startDate, selectedLeaseTypeObj, setValue]);

    // ─── Update defaults on property change ─────
    useEffect(() => {
        if (selectedPropertyId) {
            const prop = properties.find((p: Property) => String(p.PropertyID) === selectedPropertyId);
            if (prop) {
                if (prop.PropertyRent) setValue('LeaseRentHC', prop.PropertyRent);
                if (prop.PropertyMaintenance) setValue('LeaseMaintenance', prop.PropertyMaintenance);
            }
        }
    }, [selectedPropertyId, properties, setValue]);

    // ─── First bill calculation ─────
    const handleCalculateFirstBill = () => {
        const firstBillEndDate = watch('LeaseFirstBillEndDate');
        if (!startDate || !firstBillEndDate) return;

        const calculation = calculateFirstPayment(startDate, firstBillEndDate, rentHC || 0, maintenance || 0);
        if (calculation) {
            setValue('LeaseFirstBillAmount', calculation.rent);
            setValue('LeaseFirstBillCharges', calculation.charges);
        }
    };

    // ─── Autosave implementation (Task 15) ─────
    const saveMutation = useMutation({
        mutationFn: leaseApi.saveLease,
        onSuccess: (data) => {
            if (data.leaseId) {
                // setLastSavedId(data.leaseId);
                // Update URL quietly if needed: window.history.replaceState(null, '', `/leases/${data.leaseId}/edit`);
            }
            setIsSaving(false);
            setLastSavedTime(new Date());
        },
        onError: () => {
            setIsSaving(false);
        }
    });

    const triggerSave = (isDraft: boolean) => {
        const currentData = form.getValues();
        // Basic requirement: property and lease type must exist to even draft
        if (!currentData.PropertyID || !currentData.LeaseType) return;

        setIsSaving(true);
        currentData.LeaseDraft = isDraft ? 1 : 0;

        // Ensure tenants and garants are mapped correctly into the payload
        currentData.LeaseTenantIds = selectedTenants.map(t => t.TenantID).join(',');
        currentData.LeaseGarantIds = selectedGarants.map(g => g.ContactID).join(',');

        saveMutation.mutate(currentData);
    };

    useEffect(() => {
        // Autosave every 120 seconds
        const interval = setInterval(() => {
            triggerSave(true); // Save as draft periodically
        }, 120000);

        return () => clearInterval(interval);
    }, [selectedTenants, selectedGarants]); // Included dependencies that affect payload

    // ─── Final Validation (Task 15) ─────
    const handleFinalSubmit = form.handleSubmit((data) => {
        setValidationError(null);

        // Core validation
        if (!data.PropertyID) {
            setValidationError('Seleziona una proprietà per continuare.');
            setActiveTab('general');
            return;
        }
        if (!data.LeaseType) {
            setValidationError('Seleziona il tipo di contratto.');
            setActiveTab('general');
            return;
        }
        if (!data.LeaseStartDate) {
            setValidationError("La data di inizio contratto è obbligatoria.");
            setActiveTab('general');
            return;
        }
        if (selectedTenants.length === 0) {
            setValidationError("Aggiungi almeno un inquilino al contratto.");
            setActiveTab('tenants');
            return;
        }

        // Se tutto ok, salva definivamente
        triggerSave(false);
        alert('Contratto salvato e attivato con successo!'); // In a real app, redirect to detail page
    });

    // ─── RENDER TAB CONTENT ───────
    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return renderGeneralTab();
            case 'tenants': // Replacing 'additional' for now to fit Task 10
                return renderTenantsTab();
            case 'receipts':
                return <div className="text-gray-400 text-center py-12">Ricevute — in arrivo</div>;
            case 'settings':
                return <div className="text-gray-400 text-center py-12">Altre Impostazioni — in arrivo</div>;
            case 'guarantors':
                return renderGarantsTab();
            case 'insurance':
                return <div className="text-gray-400 text-center py-12">Assicurazione — in arrivo</div>;
            case 'documents':
                return <DocumentSection leaseId={1} />;
            case 'signature':
                return <SignatureSection tenants={selectedTenants} garants={selectedGarants} leaseId={1} />;
            default:
                return null;
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  TASK 7 + 8: Tab "Informazioni Generali"
    // ═══════════════════════════════════════════════════════════
    const renderGeneralTab = () => (
        <div className="space-y-8">

            {/* ── Proprietà affittata ── */}
            <section>
                <SectionTitle>Proprietà affittata</SectionTitle>
                <FormRow label="Proprietà" required>
                    <select
                        value={watch('PropertyID') || ''}
                        onChange={(e) => {
                            const newId = e.target.value;
                            if (watch('PropertyID') && watch('PropertyID') !== newId) {
                                setPendingPropertyId(newId);
                                setIsChangePropertyModalOpen(true);
                            } else {
                                setValue('PropertyID', newId);
                            }
                        }}
                        className={selectClass}
                    >
                        <option value="">— Seleziona proprietà —</option>
                        {properties.map((p: Property) => (
                            <option key={p.PropertyID} value={String(p.PropertyID)}>
                                {p.PropertyAddress}
                            </option>
                        ))}
                    </select>
                </FormRow>
            </section>

            {/* ── Tipo ── */}
            <section>
                <SectionTitle>Tipo</SectionTitle>
                <FormRow label="Tipo" required>
                    <select {...register('LeaseType')} className={selectClass}>
                        <option value="">— Seleziona tipo —</option>
                        {leaseTypes.map((lt: LeaseTypeInterface) => (
                            <option key={lt.LeaseTypeID} value={lt.LeaseTypeID}>
                                {lt.LeaseTypeTitle}
                            </option>
                        ))}
                    </select>
                </FormRow>
            </section>

            {/* ── Identificativo / Riferimento ── */}
            <section>
                <SectionTitle>Identificativo / Riferimento</SectionTitle>
                <FormRow label="Identificativo" help="Assegna un identificativo, un nome o un numero univoci. Puoi inserire o inventare un riferimento libero.">
                    <input type="text" {...register('LeaseIdentificativo')} className={inputClass} />
                </FormRow>
                <FormRow label="Numero registrazione" help="Inserire il numero di registrazione del contratto presso l'Agenzia delle Entrate.">
                    <input type="text" {...register('LeaseNumeroRegistrazione')} className={inputClass} />
                </FormRow>
            </section>

            {/* ── Durata ── */}
            <section>
                <SectionTitle>Durata</SectionTitle>
                <FormRow label="Inizio della locazione" required>
                    <input type="date" {...register('LeaseStartDate')} className={inputClass} />
                </FormRow>
                <FormRow label="Fine della locazione">
                    <input type="date" {...register('LeaseEndDate')} className={inputClass} />
                </FormRow>
                <FormRow label="Durata del contratto">
                    <input type="text" value={durationText} readOnly className={`${inputClass} bg-gray-50 text-gray-500`} />
                </FormRow>
                <FormRow label="Rinnovo">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" {...register('LeaseRinnovoTacito')} className="sr-only peer" />
                            <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors"></div>
                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                        </div>
                        <span className="text-sm text-gray-600">Tacito rinnovo</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-1">Se si seleziona l'opzione tacito rinnovo, il sito continuerà a generare rendite dopo la data di fine locazione.</p>
                </FormRow>
            </section>

            {/* ── Pagamento (Task 8) ── */}
            <section>
                <SectionTitle>Pagamento</SectionTitle>
                <FormRow label="Pagamento" required>
                    <select {...register('LeaseBillingPeriod')} className={selectClass}>
                        <option value="monthly">Mensile</option>
                        <option value="weekly">Settimanale</option>
                        <option value="biweekly">Bisettimanale</option>
                        <option value="quarterly">Trimestrale</option>
                        <option value="semiannual">Semestrale</option>
                        <option value="annual">Annuale</option>
                    </select>
                </FormRow>
                <FormRow label="">
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="anticipato" {...register('LeasePaymentTiming')} className="accent-green-600" />
                            <span className="text-sm">Pagamento anticipato</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="arretrato" {...register('LeasePaymentTiming')} className="accent-green-600" />
                            <span className="text-sm">Pagamento in arretrato</span>
                        </label>
                    </div>
                </FormRow>
                <FormRow label="Modalità di pagamento" help="Se scegli come sistema di pagamento l'addebito diretto, il sistema indicherà automaticamente come pagati gli affitti in maturazione, risparmiandoti l'operazione di aggiornamento in Finanze.">
                    <select {...register('LeasePaymentMethod')} className={selectClass}>
                        <option value="">Scegli</option>
                        <option value="addebito">Addebito diretto</option>
                        <option value="bonifico">Bonifico bancario</option>
                        <option value="contanti">Contanti</option>
                        <option value="assegno">Assegno</option>
                    </select>
                </FormRow>
                <FormRow label="Data del pagamento" help="Data di pagamento del canone di locazione previsto dal contratto.">
                    <select {...register('LeasePaymentDay', { valueAsNumber: true })} className={`${selectClass} w-24`}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </FormRow>
            </section>

            {/* ── Affitto (Task 8) ── */}
            <section>
                <SectionTitle>Affitto</SectionTitle>
                <FormRow label="Affitto (spese escluse)" required>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">€</span>
                        <input type="number" step="0.01" {...register('LeaseRentHC', { valueAsNumber: true })} className={inputClass} />
                        {vatType !== '0' && (
                            <div className="flex items-center gap-1">
                                <input type="number" step="0.01" {...register('LeaseVatPercent', { valueAsNumber: true })} className={`${inputClass} w-20`} />
                                <span className="text-xs text-gray-500">% IVA</span>
                            </div>
                        )}
                    </div>
                </FormRow>
                <FormRow label="Spese accessorie">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">€</span>
                        <input type="number" step="0.01" {...register('LeaseMaintenance', { valueAsNumber: true })} className={inputClass} />
                    </div>
                </FormRow>
                <FormRow label="">
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="anticipo" {...register('LeaseSpeseType')} className="accent-green-600" />
                            <span className="text-sm">Anticipo spese affitto</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="forfait" {...register('LeaseSpeseType')} className="accent-green-600" />
                            <span className="text-sm">Spese pagate a forfait</span>
                        </label>
                    </div>
                </FormRow>
                <FormRow label="Canone spese incluse" required>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">€</span>
                        <input
                            type="number"
                            step="0.01"
                            readOnly
                            {...register('LeaseMonthlyAmount', { valueAsNumber: true })}
                            className={`${inputClass} bg-gray-50 text-gray-500 font-medium`}
                        />
                    </div>
                </FormRow>
            </section>

            {/* ── Altre Spese (Task 8) ── */}
            <section>
                <SectionTitle>Altre spese</SectionTitle>
                {paymentItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 mb-3 p-3 bg-gray-50 rounded border border-gray-100">
                        <span className="text-gray-500 text-sm font-medium shrink-0">Pagamenti:</span>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-xs">€</span>
                            <input
                                type="number"
                                step="0.01"
                                {...register(`PaymentItems.${index}.LeasePaymentItems_Amount` as never, { valueAsNumber: true })}
                                className={`${inputClass} w-28`}
                                placeholder="Ammontare"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                step="0.01"
                                {...register(`PaymentItems.${index}.LeasePaymentItems_TaxPercent` as never, { valueAsNumber: true })}
                                className={`${inputClass} w-16`}
                                placeholder="%"
                            />
                            <span className="text-gray-500 text-xs">% IVA</span>
                        </div>
                        <select {...register(`PaymentItems.${index}.LeasePaymentItems_Type` as never)} className={`${selectClass} w-36`}>
                            <option value="">Spese accesso...</option>
                            <option value="garage">Garage</option>
                            <option value="giardino">Giardino</option>
                            <option value="pulizie">Pulizie</option>
                            <option value="altro">Altro</option>
                        </select>
                        <input
                            type="text"
                            {...register(`PaymentItems.${index}.LeasePaymentItems_Description` as never)}
                            className={`${inputClass} flex-1`}
                            placeholder="Descrizione"
                        />
                        <button
                            type="button"
                            onClick={() => removePaymentItem(index)}
                            className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => addPaymentItem({
                        LeasePaymentItems_Amount: 0,
                        LeasePaymentItems_TaxPercent: 0,
                        LeasePaymentItems_Type: '',
                        LeasePaymentItems_Description: ''
                    })}
                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Aggiungi un altro elemento
                </button>
                <p className="text-xs text-gray-400 mt-2">Altre spese in capo all'inquilino ma anticipate dal locatore. Questi pagamenti appariranno sulla ricevuta e verranno aggiunti al canone.</p>
            </section>

            {/* ── Prima ricevuta (Task 8) ── */}
            <section>
                <SectionTitle>Prima ricevuta</SectionTitle>
                <FormRow label="">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register('LeaseFirstBill')} className="w-4 h-4 accent-green-600 rounded" />
                        <span className="text-sm text-gray-600">Selezionare la casella in caso di primo affitto su base pro-rata.</span>
                    </label>
                </FormRow>

                {firstBillEnabled && (
                    <>
                        <FormRow label="Data di fine periodo" help="Data di fine periodo per la prima ricevuta.">
                            <input type="date" {...register('LeaseFirstBillEndDate')} className={inputClass} />
                        </FormRow>
                        <div className="flex justify-start mb-4 ml-0 md:ml-48">
                            <button
                                type="button"
                                onClick={handleCalculateFirstBill}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-sm hover:bg-gray-50 transition-colors"
                            >
                                <Calculator className="w-4 h-4" /> Calcola gli importi
                            </button>
                        </div>
                        <FormRow label="Affitto (spese escluse)">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">€</span>
                                <input type="number" step="0.01" {...register('LeaseFirstBillAmount', { valueAsNumber: true })} className={inputClass} />
                            </div>
                        </FormRow>
                        <FormRow label="Spese accessorie">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">€</span>
                                <input type="number" step="0.01" {...register('LeaseFirstBillCharges', { valueAsNumber: true })} className={inputClass} />
                            </div>
                        </FormRow>
                    </>
                )}
            </section>

            {/* ── Deposito Cauzionale (Task 9) ── */}
            <section>
                <SectionTitle>Deposito cauzionale</SectionTitle>
                <FormRow label="Monto">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">€</span>
                        <input type="number" step="0.01" {...register('LeaseDeposit', { valueAsNumber: true })} className={inputClass} />
                    </div>
                </FormRow>
                <FormRow label="Tipo">
                    <select {...register('LeaseDepositType')} className={selectClass}>
                        <option value="trattenuto">Trattenuto dal locatore</option>
                        <option value="banca">Depositato in banca</option>
                        <option value="altro">Altro</option>
                    </select>
                </FormRow>
                <FormRow label="Data di versamento">
                    <input type="date" {...register('LeaseDepositDate')} className={inputClass} />
                </FormRow>
            </section>

            {/* ── Affitti Prepagati (Task 9) ── */}
            <section>
                <SectionTitle>Affitti prepagati</SectionTitle>
                <FormRow label="Ammontare">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">€</span>
                        <input type="number" step="0.01" {...register('LeasePrepaidRent', { valueAsNumber: true })} className={inputClass} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">L'ammontare verrà aggiunto al saldo del locatario.</p>
                </FormRow>
            </section>

            {/* ── Aggiornamento del canone (Task 9) ── */}
            <section>
                <SectionTitle>Aggiornamento del canone</SectionTitle>
                <FormRow label="Tipo di aggiornamento">
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="nessuno" {...register('LeaseUpdateType')} className="accent-green-600" />
                            <span className="text-sm">Non rivedere</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="indice" {...register('LeaseUpdateType')} className="accent-green-600" />
                            <span className="text-sm">In base all'indice</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="percentuale" {...register('LeaseUpdateType')} className="accent-green-600" />
                            <span className="text-sm">Percentuale fissa</span>
                        </label>
                    </div>
                </FormRow>

                {watch('LeaseUpdateType') !== 'nessuno' && (
                    <>
                        {watch('LeaseUpdateType') === 'indice' && (
                            <FormRow label="Indice base">
                                <select {...register('LeaseUpdateIndex')} className={selectClass}>
                                    <option value="">Selezionare l'indice</option>
                                    <option value="istat_foi">ISTAT FOI</option>
                                    <option value="istat_nic">ISTAT NIC</option>
                                </select>
                            </FormRow>
                        )}
                        <FormRow label="">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" {...register('LeaseUpdateAuto')} className="sr-only peer" />
                                    <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors"></div>
                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                                </div>
                                <span className="text-sm text-gray-600">Applica un incremento automatico sul canone quando arriva la data</span>
                            </label>
                        </FormRow>
                        <FormRow label="Data di revisione">
                            <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="anniversario" {...register('LeaseUpdateDateType')} className="accent-green-600" />
                                    <span className="text-sm">Regolazione all'anniversario dell'inizio della locazione</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="specifica" {...register('LeaseUpdateDateType')} className="accent-green-600" />
                                    <span className="text-sm">Data di revisione specifica</span>
                                </label>
                            </div>
                            {watch('LeaseUpdateDateType') === 'specifica' && (
                                <div className="mt-2">
                                    <input type="date" {...register('LeaseUpdateDateSpecific')} className={`${inputClass} w-auto`} />
                                </div>
                            )}
                        </FormRow>
                    </>
                )}
            </section>

            {/* ── Footer: Salva / Annulla ── */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={() => {
                        triggerSave(true);
                        alert("Bozza salvata!");
                    }}
                    className="bg-[#5cb85c] hover:bg-[#449d44] text-white font-medium py-2 px-6 rounded transition-colors shadow-sm"
                >
                    Salva Bozza
                </button>
                <a
                    href="/leases"
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                    Annulla
                </a>
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════
    //  TASK 10: Tab "Inquilini"
    // ═══════════════════════════════════════════════════════════
    const renderTenantsTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                    <h3 className="text-lg font-semibold text-[#333]">Inquilini</h3>
                    <p className="text-sm text-gray-500">Aggiungi gli inquilini associati a questo contratto di locazione.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsTenantModalOpen(true)}
                    className="flex items-center gap-2 bg-[#5cb85c] hover:bg-[#449d44] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                    <UserPlus className="w-4 h-4" /> Aggiungi inquilino
                </button>
            </div>

            {selectedTenants.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded border border-dashed border-gray-300">
                    <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nessun inquilino aggiunto</p>
                    <p className="text-sm text-gray-400 mt-1">Clicca su "Aggiungi inquilino" per iniziare.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTenants.map(tenant => (
                        <div key={tenant.TenantID} className="relative p-4 border border-gray-200 rounded-lg shadow-sm bg-white group">
                            <button
                                type="button"
                                onClick={() => setSelectedTenants(prev => prev.filter(t => t.TenantID !== tenant.TenantID))}
                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                    {tenant.TenantType === 'company' ? '🏠' : (tenant.TenantFirstName?.charAt(0) || 'U')}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {tenant.TenantType === 'company' ? tenant.TenantCompanyName : `${tenant.TenantFirstName} ${tenant.TenantLastName}`}
                                    </p>
                                    <p className="text-xs text-gray-500">{tenant.TenantEmail}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 flex justify-between">
                                <span>{tenant.TenantMobilePhone || 'Nessun telefono'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddTenantModal
                isOpen={isTenantModalOpen}
                onClose={() => setIsTenantModalOpen(false)}
                onTenantAdded={(tenant) => {
                    if (!selectedTenants.find(t => t.TenantID === tenant.TenantID)) {
                        setSelectedTenants(prev => [...prev, tenant]);
                    }
                }}
                existingTenantIds={selectedTenants.map(t => t.TenantID)}
            />
        </div>
    );

    // ═══════════════════════════════════════════════════════════
    //  TASK 11: Tab "Garanti"
    // ═══════════════════════════════════════════════════════════
    const renderGarantsTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                    <h3 className="text-lg font-semibold text-[#333]">Garanti</h3>
                    <p className="text-sm text-gray-500">Aggiungi i garanti associati a questo contratto di locazione.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsGarantModalOpen(true)}
                    className="flex items-center gap-2 bg-[#337ab7] hover:bg-[#286090] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                    <ShieldCheck className="w-4 h-4" /> Aggiungi garante
                </button>
            </div>

            {selectedGarants.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded border border-dashed border-gray-300">
                    <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nessun garante aggiunto</p>
                    <p className="text-sm text-gray-400 mt-1">Clicca su "Aggiungi garante" per iniziare.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedGarants.map(garant => (
                        <div key={garant.ContactID} className="relative p-4 border border-gray-200 rounded-lg shadow-sm bg-white group hover:border-[#337ab7] transition-colors">
                            <button
                                type="button"
                                onClick={() => setSelectedGarants(prev => prev.filter(g => g.ContactID !== garant.ContactID))}
                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#337ab7] font-bold">
                                    {garant.ContactType === 'company' ? '🏢' : (garant.ContactFirstName?.charAt(0) || 'U')}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {garant.ContactType === 'company' ? garant.ContactCompanyName : `${garant.ContactFirstName} ${garant.ContactLastName}`}
                                    </p>
                                    <p className="text-xs text-gray-500">{garant.ContactEmail}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 flex justify-between">
                                <span>{garant.ContactMobilePhone || 'Nessun telefono'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddGarantModal
                isOpen={isGarantModalOpen}
                onClose={() => setIsGarantModalOpen(false)}
                onGarantAdded={(garant) => {
                    if (!selectedGarants.find(g => g.ContactID === garant.ContactID)) {
                        setSelectedGarants(prev => [...prev, garant]);
                    }
                }}
                existingGarantIds={selectedGarants.map(g => g.ContactID)}
            />
        </div>
    );

    // ─── RENDER ──────────────────────────────────────────────
    return (
        <form onSubmit={handleFinalSubmit}>
            <LeaseTabs activeTab={activeTab} onTabChange={setActiveTab}>
                {renderTabContent()}
            </LeaseTabs>

            <ChangePropertyModal
                isOpen={isChangePropertyModalOpen}
                onClose={() => {
                    setIsChangePropertyModalOpen(false);
                    setPendingPropertyId(null);
                }}
                onConfirm={() => {
                    if (pendingPropertyId) {
                        setValue('PropertyID', pendingPropertyId);
                        // Future implementation: logic to reset fields (rent, expenses, etc.)
                        console.log(`Resetting financial fields for new property: ${pendingPropertyId}`);
                    }
                }}
                newPropertyName={properties.find(p => String(p.PropertyID) === pendingPropertyId)?.PropertyAddress}
            />

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
            />

            {/* Validation Error Toast */}
            {validationError && (
                <div className="fixed bottom-24 right-8 z-50 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg max-w-md flex items-start gap-3 animate-fade-in">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-red-800 font-medium text-sm">Errore di validazione</h4>
                        <p className="text-red-700 text-sm mt-1">{validationError}</p>
                    </div>
                    <button onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Footer Form Actions */}
            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2">
                    {isSaving ? (
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-[#337ab7] border-t-transparent rounded-full animate-spin"></div>
                            Salvataggio in corso...
                        </span>
                    ) : lastSavedTime ? (
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Ultimo salvataggio automatico: {lastSavedTime.toLocaleTimeString()}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-sm italic">
                            Modifiche non salvate
                        </span>
                    )}
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => triggerSave(true)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                        disabled={isSaving}
                    >
                        <Save className="w-4 h-4" />
                        Salva Bozza
                    </button>
                    <button
                        type="button"
                        onClick={handleFinalSubmit}
                        className="px-6 py-2 bg-[#5cb85c] hover:bg-[#449d44] text-white font-bold rounded shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Salvataggio...' : 'Attiva Contratto'}
                    </button>
                </div>
            </div>
        </form>
    );
};
