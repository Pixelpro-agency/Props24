import { LeasePaymentOperationError } from './databaseErrors';
import { isValidIsoDate } from './dataSelectors';

export const PAYMENT_CONFIRMATION_METHODS = [
    'bonifico',
    'contanti',
    'assegno',
    'carta',
    'addebito',
] as const;

export type PaymentConfirmationMethod =
    typeof PAYMENT_CONFIRMATION_METHODS[number];

export interface PaymentConfirmationInput {
    method: string;
    paidDate: string;
    amount: number;
    note?: string;
}

export interface ValidatedPaymentConfirmation {
    method: PaymentConfirmationMethod;
    paidDate: string;
    amount: number;
    note: string;
}

export function validatePaymentConfirmation(
    input: PaymentConfirmationInput,
    expectedAmount: number,
    referenceDate: string,
): ValidatedPaymentConfirmation {
    if (!PAYMENT_CONFIRMATION_METHODS.includes(input.method as PaymentConfirmationMethod)) {
        throw new LeasePaymentOperationError('Seleziona un metodo di pagamento valido.');
    }
    if (!isValidIsoDate(input.paidDate)) {
        throw new LeasePaymentOperationError('Inserisci una data di pagamento valida.');
    }
    if (!isValidIsoDate(referenceDate)) {
        throw new LeasePaymentOperationError('Data di riferimento non valida.');
    }
    if (input.paidDate > referenceDate) {
        throw new LeasePaymentOperationError('La data pagamento non può essere futura.');
    }
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
        throw new LeasePaymentOperationError('Il totale del pagamento non è valido.');
    }

    const expectedCents = Math.round(expectedAmount * 100);
    if (!Number.isFinite(input.amount)
        || input.amount <= 0
        || Math.round(input.amount * 100) !== expectedCents) {
        throw new LeasePaymentOperationError("L'importo confermato deve coincidere con il totale del pagamento.");
    }

    return {
        method: input.method as PaymentConfirmationMethod,
        paidDate: input.paidDate,
        amount: expectedCents / 100,
        note: input.note?.trim() ?? '',
    };
}
