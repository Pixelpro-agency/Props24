import type { LeaseDetail } from '../../types/leaseDetail';

export type ToastHandler = (variant: 'success' | 'error', message: string) => void;

export function formatDate(value: string): string {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
}

export function currency(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Operazione non riuscita.';
}

export function leaseTitle(detail: LeaseDetail): string {
    return detail.property?.formData.PropertyTitle || detail.lease.formData.LeaseIdentificativo || detail.lease.id;
}

export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}
