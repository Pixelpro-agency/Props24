import type { LeaseListItem } from '../db/leaseRepository';

const COLUMNS: Array<[string, (lease: LeaseListItem) => string | number | null]> = [
    ['ID', (lease) => lease.id],
    ['identificativo', (lease) => lease.identificativo],
    ['registrazione', (lease) => lease.numeroRegistrazione],
    ['proprietà', (lease) => lease.propertyTitle],
    ['indirizzo', (lease) => lease.propertyAddress],
    ['inquilini', (lease) => lease.tenantName],
    ['garanti', () => ''],
    ['tipo', (lease) => lease.leaseTypeLabel],
    ['stato', (lease) => lease.temporalStatus],
    ['inizio', (lease) => formatDate(lease.startDate)],
    ['fine', (lease) => formatDate(lease.endDate)],
    ['periodicità', () => ''],
    ['canone', (lease) => lease.rentHC],
    ['spese', (lease) => lease.maintenance],
    ['IVA', () => ''],
    ['importo periodico', (lease) => lease.periodicAmount],
    ['deposito', (lease) => lease.securityDeposit],
    ['prepagato', () => ''],
    ['saldo', (lease) => lease.balance],
    ['note', (lease) => lease.notes],
];

function formatDate(value: string): string {
    if (!value) return '';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
}

function cell(value: unknown): string {
    const raw = String(value ?? '');
    return /[";\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

export function buildLeasesCsv(leases: LeaseListItem[], selectedColumns: string[]): string {
    const selected = selectedColumns.length > 0 ? COLUMNS.filter(([name]) => selectedColumns.includes(name)) : COLUMNS;
    return `\uFEFF${selected.map(([name]) => cell(name)).join(';')}\r\n${leases.map((lease) => selected.map(([, getter]) => cell(getter(lease))).join(';')).join('\r\n')}`;
}

export function exportLeasesCsv(leases: LeaseListItem[], selectedColumns: string[] = []): void {
    const csv = buildLeasesCsv(leases, selectedColumns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `props24-locazioni-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
