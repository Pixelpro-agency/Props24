import { describe, expect, it } from 'vitest';

import { LeasePaymentOperationError } from '../../src/db/databaseErrors';
import {
  PAYMENT_CONFIRMATION_METHODS,
  validatePaymentConfirmation,
} from '../../src/db/paymentConfirmation';

const REFERENCE_DATE = '2026-06-15';
const EXPECTED_AMOUNT = 1100;

function validInput(overrides: Partial<Parameters<typeof validatePaymentConfirmation>[0]> = {}) {
  return {
    method: 'bonifico',
    paidDate: REFERENCE_DATE,
    amount: EXPECTED_AMOUNT,
    note: '  Bonifico ricevuto  ',
    ...overrides,
  };
}

function expectOperationError(run: () => unknown, message: string) {
  expect(run).toThrowError(LeasePaymentOperationError);
  expect(run).toThrowError(message);
}

describe('validatePaymentConfirmation', () => {
  it.each(PAYMENT_CONFIRMATION_METHODS)('accepts the canonical method %s', (method) => {
    const result = validatePaymentConfirmation(
      validInput({ method }),
      EXPECTED_AMOUNT,
      REFERENCE_DATE,
    );

    expect(result.method).toBe(method);
    expect(result.paidDate).toBe(REFERENCE_DATE);
    expect(result.amount).toBe(EXPECTED_AMOUNT);
    expect(result.note).toBe('Bonifico ricevuto');
  });

  it.each([
    [undefined, ''],
    ['   ', ''],
    ['  Bonifico ricevuto  ', 'Bonifico ricevuto'],
  ] as const)('normalizes an optional note', (note, expectedNote) => {
    const result = validatePaymentConfirmation(
      validInput({ note }),
      EXPECTED_AMOUNT,
      REFERENCE_DATE,
    );

    expect(result.note).toBe(expectedNote);
  });

  it.each(['', 'cash', 'direct_debit', 'paypal', 'BONIFICO'])(
    'rejects the non-canonical method %j',
    (method) => {
      expectOperationError(
        () => validatePaymentConfirmation(validInput({ method }), EXPECTED_AMOUNT, REFERENCE_DATE),
        'Seleziona un metodo di pagamento valido.',
      );
    },
  );

  it.each(['', '2026-02-30', '15/06/2026', 'test'])(
    'rejects the invalid payment date %j',
    (paidDate) => {
      expectOperationError(
        () => validatePaymentConfirmation(validInput({ paidDate }), EXPECTED_AMOUNT, REFERENCE_DATE),
        'Inserisci una data di pagamento valida.',
      );
    },
  );

  it('rejects an invalid reference date', () => {
    expectOperationError(
      () => validatePaymentConfirmation(validInput(), EXPECTED_AMOUNT, '2026-02-30'),
      'Data di riferimento non valida.',
    );
  });

  it('rejects a future payment date and accepts the reference date', () => {
    expectOperationError(
      () => validatePaymentConfirmation(
        validInput({ paidDate: '2026-06-16' }),
        EXPECTED_AMOUNT,
        REFERENCE_DATE,
      ),
      'La data pagamento non può essere futura.',
    );

    expect(validatePaymentConfirmation(validInput(), EXPECTED_AMOUNT, REFERENCE_DATE).paidDate)
      .toBe(REFERENCE_DATE);
  });

  it.each([
    [1100, 1100],
    [1100.001, 1100],
  ])('accepts and normalizes the matching amount %s', (amount, expected) => {
    expect(validatePaymentConfirmation(
      validInput({ amount }),
      EXPECTED_AMOUNT,
      REFERENCE_DATE,
    ).amount).toBe(expected);
  });

  it.each([1099.99, 1100.01, 550, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the non-matching amount %s',
    (amount) => {
      expectOperationError(
        () => validatePaymentConfirmation(validInput({ amount }), EXPECTED_AMOUNT, REFERENCE_DATE),
        "L'importo confermato deve coincidere con il totale del pagamento.",
      );
    },
  );

  it.each([0, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the invalid expected amount %s',
    (expectedAmount) => {
      expectOperationError(
        () => validatePaymentConfirmation(validInput(), expectedAmount, REFERENCE_DATE),
        'Il totale del pagamento non è valido.',
      );
    },
  );

  it('does not mutate the input object', () => {
    const input = validInput();
    const original = { ...input };

    validatePaymentConfirmation(input, EXPECTED_AMOUNT, REFERENCE_DATE);

    expect(input).toEqual(original);
  });
});
