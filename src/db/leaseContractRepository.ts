import { getJsonDb } from './jsonDb';
import type { LocalDatabase } from './database.types';
import { createLeaseDocument } from './documentRepository';
import { LeaseNotFoundError } from './databaseErrors';
import { escapeHtml, textToDataUrl, downloadDataUrl } from '../utils/html';
import { normalizeLeaseFormData, type LeaseBillingPeriod, type LeaseFormData } from '../landlord/leases/schema/leaseFormSchema';

function currency(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function formatIsoDate(value: string): string {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('it-IT', { timeZone: 'UTC' }) : 'Non specificata';
}

function formatDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Non disponibile' : date.toLocaleString('it-IT');
}

function contractRevisionAt(lease: LocalDatabase['leases'][number]): string {
    const contractualActivity = [...lease.activity]
        .reverse()
        .find((item) => item.type === 'updated' || item.type === 'created');

    return contractualActivity?.createdAt || lease.createdAt || lease.updatedAt;
}

function percentage(value: number): string { return `${value}%`; }
function yesNo(value: boolean): string { return value ? 'Sì' : 'No'; }
function billingPeriodLabel(value: LeaseBillingPeriod): string {
    return { weekly: 'Settimanale', biweekly: 'Ogni due settimane', monthly: 'Mensile', bimonthly: 'Bimestrale', quarterly: 'Trimestrale', fourmonthly: 'Quadrimestrale', semiannual: 'Semestrale', annual: 'Annuale' }[value];
}
function paymentTimingLabel(value: LeaseFormData['LeasePaymentTiming']): string { return value === 'arretrato' ? 'Pagamento in arretrato' : 'Pagamento anticipato'; }
function paymentMethodLabel(value: string): string {
    return ({ bonifico: 'Bonifico', assegno: 'Assegno', contanti: 'Contanti', carta: 'Carta', addebito: 'Addebito diretto' } as Record<string, string>)[value] || value || 'Non specificato';
}
function generationOffsetLabel(value: number): string { return value === 0 ? 'Stessa data della ricevuta' : value > 0 ? `G+${value}` : `G${value}`; }
function depositTypeLabel(value: LeaseFormData['LeaseDepositType']): string { return value === 'terzi' ? 'Deposito presso terzi' : 'Trattenuto dal locatore'; }
function insuranceTypeLabel(value: LeaseFormData['LeaseInsuranceContracts'][number]['LeaseInsuranceType']): string { return value === 'locativa' ? 'Assicurazione locativa' : 'Assicurazione affitti non pagati'; }
function rentUpdateDescription(formData: LeaseFormData): string {
    if (formData.LeaseUpdateType === 'nessuno') return 'Nessun aggiornamento';

    const type = formData.LeaseUpdateType === 'percentuale'
        ? `Percentuale: ${percentage(formData.LeaseUpdatePercent)}`
        : `Indice: ${formData.LeaseUpdateIndex || 'Non specificato'}`;
    const period = formData.LeaseUpdateYears === 1 ? 'Ogni anno' : `Ogni ${formData.LeaseUpdateYears} anni`;
    const date = formData.LeaseUpdateDateType === 'specifica'
        ? `Data specifica: ${formatIsoDate(formData.LeaseUpdateDateSpecific)}`
        : 'Alla data anniversaria';
    const automatic = `Applicazione automatica: ${yesNo(formData.LeaseUpdateAuto)}`;
    const base = formData.LeaseUpdateAmountType === 'rent_including_charges'
        ? 'Base: canone incluso spese'
        : 'Base: canone escluso spese';

    return [type, period, date, automatic, base].join(' — ');
}
function tenantName(tenant: LocalDatabase['tenants'][number]): string { return tenant.type === 'company' ? tenant.companyName : `${tenant.firstName} ${tenant.lastName}`.trim(); }
function renderRows(rows: Array<[string, string]>): string {
    return `<table><tbody>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</tbody></table>`;
}
function section(title: string, rows: Array<[string, string]>): string { return `<section><h2>${escapeHtml(title)}</h2>${renderRows(rows)}</section>`; }

export function buildLeaseContractHtml(database: LocalDatabase, leaseId: string): string {
    const lease = database.leases.find((item) => item.id === leaseId);
    if (!lease) throw new LeaseNotFoundError();
    const formData = normalizeLeaseFormData(lease.formData);
    const property = database.properties.find((item) => item.id === lease.propertyId);
    const tenants = lease.tenantIds.map((id) => database.tenants.find((tenant) => tenant.id === id)).filter(Boolean) as LocalDatabase['tenants'];
    const guarantors = lease.guarantorIds.map((id) => database.contacts.find((contact) => contact.id === id)).filter(Boolean) as LocalDatabase['contacts'];
    const weekly = formData.LeaseBillingPeriod === 'weekly' || formData.LeaseBillingPeriod === 'biweekly';
    const parts: Array<[string, string]> = [
        ['Tipo locazione', lease.leaseTypeLabel || 'Non disponibile'],
        ['Proprietà', property?.formData.PropertyTitle || 'Non disponibile'],
        ['Indirizzo', [property?.formData.PropertyAddress, property?.formData.PropertyPostalCode, property?.formData.PropertyCity].filter(Boolean).join(', ') || 'Non disponibile'],
        ['Inquilini', tenants.map(tenantName).join(', ') || 'Non disponibile'],
        ['Garanti', guarantors.map((g) => g.type === 'company' ? g.companyName : `${g.firstName} ${g.lastName}`.trim()).join(', ') || 'Nessuno'],
    ];
    const duration: Array<[string, string]> = [
        ['Data iniziale', formatIsoDate(formData.LeaseStartDate)], ['Data finale', formatIsoDate(formData.LeaseEndDate)],
        ['Rinnovo tacito', yesNo(formData.LeaseRinnovoTacito)], ['Periodicità', billingPeriodLabel(formData.LeaseBillingPeriod)],
        ['Scadenza', paymentTimingLabel(formData.LeasePaymentTiming)], ['Metodo di pagamento', paymentMethodLabel(formData.LeasePaymentMethod)],
        ['Data del pagamento', weekly ? 'Derivata dal periodo' : `Giorno ${formData.LeasePaymentDay}`],
        ['Periodo delle ricevute', weekly ? `Blocchi di ${formData.LeaseBillingPeriod === 'weekly' ? 7 : 14} giorni` : `Giorno ${formData.LeaseReceiptPeriodDay}`],
        ['Generazione del pagamento', generationOffsetLabel(formData.LeasePaymentCreateOffsetDays)],
    ];
    const expenses = formData.LeaseSpeseType === 'forfait' ? 'Spese a forfait' : 'Anticipo spese';
    const economic: Array<[string, string]> = [
        ['Canone escluso spese', currency(formData.LeaseRentHC)], ['IVA canone', percentage(formData.LeaseRentVatPercent)],
        ['Spese accessorie', currency(formData.LeaseMaintenance)], ['IVA spese accessorie', percentage(formData.LeaseMaintenanceVatPercent)],
        ['Gestione spese', expenses], ['Totale periodico', currency(formData.LeaseMonthlyAmount)],
        ['Deposito cauzionale', currency(formData.LeaseDeposit)], ['Tipo deposito', depositTypeLabel(formData.LeaseDepositType)],
        ['Data deposito', formatIsoDate(formData.LeaseDepositDate)], ['Affitto prepagato', currency(formData.LeasePrepaidRent)],
        ['Aggiornamento del canone', rentUpdateDescription(formData)],
    ];
    if (formData.LeaseSpeseType === 'forfait' && formData.LeaseSpeseDescription.trim()) economic.push(['Descrizione spese', formData.LeaseSpeseDescription]);
    if (formData.LeaseDepositType === 'terzi' && formData.LeaseDepositTerms.trim()) economic.push(['Informazioni sul deposito', formData.LeaseDepositTerms]);
    formData.PaymentItems.forEach((item, index) => {
        const pieces = [item.LeasePaymentItems_Description, item.LeasePaymentItems_Type === 'rent' ? 'Affitto' : 'Spese accessorie', currency(item.LeasePaymentItems_Amount), `IVA ${percentage(item.LeasePaymentItems_TaxPercent)}`].filter(Boolean);
        economic.push([`Elemento aggiuntivo ${index + 1}`, pieces.join(' — ')]);
    });
    const firstBill = formData.LeaseFirstBill ? section('Prima ricevuta', [
        ['Data iniziale', formatIsoDate(formData.LeaseStartDate)], ['Data finale', formatIsoDate(formData.LeaseFirstBillEndDate)],
        ['Canone pro-rata', currency(formData.LeaseFirstBillAmount)], ['Spese pro-rata', currency(formData.LeaseFirstBillCharges)],
        ['Totale prima ricevuta', currency(formData.LeaseFirstBillAmount + formData.LeaseFirstBillCharges)],
    ]) : '';
    const insuranceRows: Array<[string, string]> = [];
    formData.LeaseInsuranceContracts.forEach((contract, index) => {
        const document = database.documents.find((item) => item.id === contract.LeaseInsuranceDocumentId && item.ownerType === 'lease' && item.ownerId === lease.id);
        insuranceRows.push([`Assicurazione ${index + 1}`, `${insuranceTypeLabel(contract.LeaseInsuranceType)} — ${contract.LeaseInsuranceDescription}`]);
        insuranceRows.push(['Data iniziale', formatIsoDate(contract.LeaseInsuranceStartDate)], ['Data scadenza', formatIsoDate(contract.LeaseInsuranceEndDate)], ['Documento collegato', !contract.LeaseInsuranceDocumentId ? 'No' : document ? 'Sì' : 'Riferimento legacy']);
    });
    const references = section('Riferimenti', [['Identificativo', formData.LeaseIdentificativo], ['Numero registrazione', formData.LeaseNumeroRegistrazione], ['Dati contrattuali aggiornati', formatDateTime(contractRevisionAt(lease))]]);
    return `<!doctype html><html><head><meta charset="utf-8"><title>Contratto ${escapeHtml(lease.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.5;color:#111}section{margin:24px 0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}h1{font-size:24px}h2{font-size:18px}</style></head><body><h1>Contratto di locazione</h1>${section('Parti e immobile', parts)}${section('Durata e pagamento', duration)}${section('Condizioni economiche', economic)}${firstBill}${insuranceRows.length ? section('Assicurazioni', insuranceRows) : ''}${references}</body></html>`;
}

export function buildLeaseContractFile(database: LocalDatabase, leaseId: string) {
    const html = buildLeaseContractHtml(database, leaseId);
    return { id: `contract-file-${leaseId}`, name: `contratto-${leaseId}.html`, type: 'text/html', size: html.length, lastModified: 0, dataUrl: textToDataUrl(html, 'text/html') };
}
export function saveLeaseContractSnapshot(leaseId: string) {
    const db = getJsonDb();
    const file = buildLeaseContractFile(db, leaseId);
    const last = [...db.documents].reverse().find((doc) => doc.ownerType === 'lease' && doc.ownerId === leaseId && doc.categoryLabel === 'Contratto di locazione');
    if (last?.file?.dataUrl === file.dataUrl) return last;
    return createLeaseDocument(leaseId, { categoryId: 900, categoryLabel: 'Contratto di locazione', title: 'Contratto di locazione', description: 'Snapshot contratto locale', isShared: false, file });
}
export function downloadLeaseContract(leaseId: string): void { const file = buildLeaseContractFile(getJsonDb(), leaseId); downloadDataUrl(file.dataUrl, file.name); }
export function printLeaseContract(leaseId: string): void { const html = buildLeaseContractHtml(getJsonDb(), leaseId); const win = window.open('', '_blank'); if (!win) return; win.document.write(html); win.document.close(); win.print(); }
