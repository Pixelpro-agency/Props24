import { getJsonDb } from './jsonDb';
import { LeaseNotFoundError, LeasePaymentOperationError } from './databaseErrors';
import { escapeHtml, textToDataUrl, downloadDataUrl } from '../utils/html';

function currency(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

export function buildPaymentReceiptHtml(database: ReturnType<typeof getJsonDb>, leaseId: string, paymentId: string): string {
    const lease = database.leases.find((item) => item.id === leaseId);
    const payment = database.payments.find((item) => item.id === paymentId && item.leaseId === leaseId);
    if (!lease || !payment) throw new LeaseNotFoundError();
    if (payment.accountingRole !== 'revenue' || payment.status !== 'paid' || !payment.receiptNumber) throw new LeasePaymentOperationError('La ricevuta è disponibile solo per ricavi incassati.');
    const property = database.properties.find((item) => item.id === lease.propertyId);
    const tenant = payment.tenantId ? database.tenants.find((item) => item.id === payment.tenantId) : database.tenants.find((item) => lease.tenantIds.includes(item.id));
    const user = database.userProfile as { firstName?: string; lastName?: string; name?: string; companyName?: string };
    const landlord = user.companyName || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Locatore';
    const tenantName = tenant ? (tenant.type === 'company' ? tenant.companyName : `${tenant.firstName} ${tenant.lastName}`.trim()) : '';
    const rows = [
        ['Numero ricevuta', payment.receiptNumber],
        ['Data pagamento', payment.paidDate],
        ['Locatore', landlord],
        ['Proprietà', property?.formData.PropertyTitle || ''],
        ['Indirizzo', [property?.formData.PropertyAddress, property?.formData.PropertyPostalCode, property?.formData.PropertyCity].filter(Boolean).join(', ')],
        ['Inquilino', tenantName],
        ['Locazione', lease.formData.LeaseIdentificativo || lease.id],
        ['Registrazione', lease.formData.LeaseNumeroRegistrazione],
        ['Descrizione', payment.description],
        ['Importo', currency(payment.amount)],
        ['Metodo', lease.formData.LeasePaymentMethod],
    ];
    return `<!doctype html><html><head><meta charset="utf-8"><title>Ricevuta ${escapeHtml(payment.receiptNumber)}</title><style>body{font-family:Arial,sans-serif;color:#111}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h1>Ricevuta</h1><table><tbody>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</tbody></table></body></html>`;
}

export function downloadPaymentReceipt(leaseId: string, paymentId: string): void {
    const db = getJsonDb();
    const payment = db.payments.find((item) => item.id === paymentId);
    const html = buildPaymentReceiptHtml(db, leaseId, paymentId);
    downloadDataUrl(textToDataUrl(html, 'text/html'), `ricevuta-${payment?.receiptNumber || paymentId}.html`);
}

export function printPaymentReceipt(leaseId: string, paymentId: string): void {
    const html = buildPaymentReceiptHtml(getJsonDb(), leaseId, paymentId);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
}
