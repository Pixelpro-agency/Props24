import { describe, expect, it } from 'vitest';

import { LeasePaymentOperationError } from '../../src/db/databaseErrors';
import {
  PAYMENT_CONFIRMATION_METHODS,
  normalizePaymentConfirmationRecord,
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

describe('normalizePaymentConfirmationRecord', () => {
  const storedRecord = {
    method: 'bonifico',
    paidDate: '2026-06-15',
    amount: 1100.005,
    note: '  Incasso verificato  ',
    confirmedAt: '2026-06-15T12:00:00.000Z',
  };

  it('normalizes a complete stored record without mutating it', () => {
    const original = { ...storedRecord };

    expect(normalizePaymentConfirmationRecord(storedRecord)).toEqual({
      ...storedRecord,
      amount: 1100.01,
      note: 'Incasso verificato',
    });
    expect(storedRecord).toEqual(original);
  });

  it.each([null, undefined, 'record', 12])('rejects the non-object value %j', (value) => {
    expect(normalizePaymentConfirmationRecord(value)).toBeNull();
  });

  it('rejects an unknown method and an invalid paid date', () => {
    expect(normalizePaymentConfirmationRecord({ ...storedRecord, method: 'cash' })).toBeNull();
    expect(normalizePaymentConfirmationRecord({ ...storedRecord, paidDate: '2026-02-30' })).toBeNull();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the invalid stored amount %s',
    (amount) => {
      expect(normalizePaymentConfirmationRecord({ ...storedRecord, amount })).toBeNull();
    },
  );

  it.each(['', 'not-a-timestamp'])('rejects the invalid confirmation timestamp %j', (confirmedAt) => {
    expect(normalizePaymentConfirmationRecord({ ...storedRecord, confirmedAt })).toBeNull();
  });

  it('normalizes a missing or non-textual note to an empty string', () => {
    expect(normalizePaymentConfirmationRecord({ ...storedRecord, note: undefined })?.note).toBe('');
    expect(normalizePaymentConfirmationRecord({ ...storedRecord, note: 42 })?.note).toBe('');
  });
});
