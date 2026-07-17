import { getJsonDb } from './jsonDb';
import type { LocalDatabase } from './database.types';
import { createLeaseDocument } from './documentRepository';
import { LeaseNotFoundError } from './databaseErrors';
import { escapeHtml, textToDataUrl, downloadDataUrl } from '../utils/html';

function currency(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function tenantName(tenant: LocalDatabase['tenants'][number]): string {
    return tenant.type === 'company' ? tenant.companyName : `${tenant.firstName} ${tenant.lastName}`.trim();
}

export function buildLeaseContractHtml(database: LocalDatabase, leaseId: string): string {
    const lease = database.leases.find((item) => item.id === leaseId);
    if (!lease) throw new LeaseNotFoundError();
    const property = database.properties.find((item) => item.id === lease.propertyId);
    const tenants = lease.tenantIds.map((id) => database.tenants.find((tenant) => tenant.id === id)).filter(Boolean) as LocalDatabase['tenants'];
    const guarantors = lease.guarantorIds.map((id) => database.contacts.find((contact) => contact.id === id)).filter(Boolean) as LocalDatabase['contacts'];
    const rows = [
        ['Tipo locazione', lease.leaseTypeLabel],
        ['Identificativo', lease.formData.LeaseIdentificativo],
        ['Numero registrazione', lease.formData.LeaseNumeroRegistrazione],
        ['Proprietà', property?.formData.PropertyTitle || ''],
        ['Indirizzo', [property?.formData.PropertyAddress, property?.formData.PropertyPostalCode, property?.formData.PropertyCity].filter(Boolean).join(', ')],
        ['Inquilini', tenants.map(tenantName).join(', ')],
        ['Garanti', guarantors.map((g) => g.type === 'company' ? g.companyName : `${g.firstName} ${g.lastName}`.trim()).join(', ')],
        ['Inizio', lease.startDate],
        ['Fine', lease.endDate],
        ['Rinnovo', lease.formData.LeaseRinnovoTacito ? 'Sì' : 'No'],
        ['PeriodicitÃ ', lease.billingPeriod],
        ['Metodo pagamento', lease.formData.LeasePaymentMethod],
        ['Canone', currency(lease.rentAmount)],
        ['Spese', currency(lease.utilitiesAmount)],
        ['IVA', lease.formData.LeaseVatType === 'percent' ? `${lease.formData.LeaseVatPercent}%` : 'Non applicata'],
        ['Importo periodico', currency(lease.formData.LeaseMonthlyAmount)],
        ['Deposito', currency(lease.depositAmount)],
        ['Prepagato', currency(lease.formData.LeasePrepaidRent)],
        ['Revisione canone', lease.formData.LeaseUpdateType],
        ['Note', lease.notes],
        ['Data generazione', new Date().toLocaleString('it-IT')],
    ];
    return `<!doctype html><html><head><meta charset="utf-8"><title>Contratto ${escapeHtml(lease.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.5;color:#111}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}h1{font-size:22px}</style></head><body><h1>Contratto di locazione</h1><table><tbody>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</tbody></table></body></html>`;
}

export function buildLeaseContractFile(database: LocalDatabase, leaseId: string) {
    const html = buildLeaseContractHtml(database, leaseId);
    return { id: `contract-file-${leaseId}`, name: `contratto-${leaseId}.html`, type: 'text/html', size: html.length, lastModified: Date.now(), dataUrl: textToDataUrl(html, 'text/html') };
}

export function saveLeaseContractSnapshot(leaseId: string) {
    const db = getJsonDb();
    const file = buildLeaseContractFile(db, leaseId);
    const last = [...db.documents].reverse().find((doc) => doc.ownerType === 'lease' && doc.ownerId === leaseId && doc.categoryLabel === 'Contratto di locazione');
    if (last?.file?.dataUrl === file.dataUrl) return last;
    return createLeaseDocument(leaseId, { categoryId: 900, categoryLabel: 'Contratto di locazione', title: `Contratto ${new Date().toLocaleDateString('it-IT')}`, description: 'Snapshot contratto locale', isShared: false, file });
}

export function downloadLeaseContract(leaseId: string): void {
    const file = buildLeaseContractFile(getJsonDb(), leaseId);
    downloadDataUrl(file.dataUrl, file.name);
}

export function printLeaseContract(leaseId: string): void {
    const html = buildLeaseContractHtml(getJsonDb(), leaseId);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
}
