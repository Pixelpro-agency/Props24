import type { LeaseRecord, LocalDatabase, PaymentRecord } from './database.types';
import { classifyLease, todayIso } from './dataSelectors';
import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
import { LeaseDepositError, LeaseNotFoundError, LeasePaymentNotFoundError, LeasePaymentOperationError, LeasePrepaidRentError } from './databaseErrors';

export interface LeasePaymentPeriod {
    startDate: string;
    endDate: string;
    index: number;
    isFirstCustomPeriod: boolean;
}

function parseDate(value: string): Date {
    return new Date(`${value}T00:00:00Z`);
}

function iso(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
    const date = parseDate(value);
    date.setUTCDate(date.getUTCDate() + days);
    return iso(date);
}

function lastDayOfMonth(year: number, monthIndex: number): number {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function preferredDayInMonth(year: number, monthIndex: number, paymentDay: number): string {
    const day = Math.min(Math.max(1, paymentDay), lastDayOfMonth(year, monthIndex));
    return iso(new Date(Date.UTC(year, monthIndex, day)));
}

export function clampIsoDate(value: string, min: string, max: string): string {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

function addMonths(value: string, months: number): string {
    const source = parseDate(value);
    const day = source.getUTCDate();
    const target = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1));
    target.setUTCDate(Math.min(day, lastDayOfMonth(target.getUTCFullYear(), target.getUTCMonth())));
    return iso(target);
}

function periodStep(lease: LeaseRecord): { days?: number; months?: number } {
    if (lease.billingPeriod === 'weekly') return { days: 7 };
    if (lease.billingPeriod === 'biweekly') return { days: 14 };
    if (lease.billingPeriod === 'quarterly') return { months: 3 };
    if (lease.billingPeriod === 'semiannual') return { months: 6 };
    if (lease.billingPeriod === 'annual') return { months: 12 };
    return { months: 1 };
}

function nextPeriodStart(start: string, lease: LeaseRecord): string {
    const step = periodStep(lease);
    return step.days ? addDays(start, step.days) : addMonths(start, step.months || 1);
}

function scheduleHorizon(lease: LeaseRecord, referenceDate: string): string {
    if (!lease.formData.LeaseRinnovoTacito) return lease.endDate;
    const date = parseDate(referenceDate);
    date.setUTCMonth(date.getUTCMonth() + 12);
    return iso(date) > lease.endDate ? iso(date) : lease.endDate;
}

function periodAmount(lease: LeaseRecord): number {
    return Number((lease.formData.LeaseMonthlyAmount || lease.rentAmount + lease.utilitiesAmount).toFixed(2));
}

function paymentStatus(dueDate: string, method: string, referenceDate: string): Pick<PaymentRecord, 'status' | 'paidDate'> {
    if (method === 'addebito' && dueDate <= referenceDate) return { status: 'paid', paidDate: dueDate };
    if (dueDate < referenceDate) return { status: 'late', paidDate: null };
    return { status: 'pending', paidDate: null };
}

export function buildLeasePaymentPeriods(lease: LeaseRecord, referenceDate = todayIso()): LeasePaymentPeriod[] {
    const periods: LeasePaymentPeriod[] = [];
    const horizon = scheduleHorizon(lease, referenceDate);
    let cursor = lease.startDate;
    let index = 0;

    if (lease.formData.LeaseFirstBill) {
        const firstEnd = clampIsoDate(lease.formData.LeaseFirstBillEndDate, lease.startDate, horizon);
        periods.push({ startDate: lease.startDate, endDate: firstEnd, index: index++, isFirstCustomPeriod: true });
        cursor = addDays(firstEnd, 1);
    }

    while (cursor <= horizon) {
        const nextStart = nextPeriodStart(cursor, lease);
        const endDate = clampIsoDate(addDays(nextStart, -1), cursor, horizon);
        periods.push({ startDate: cursor, endDate, index: index++, isFirstCustomPeriod: false });
        cursor = addDays(endDate, 1);
    }

    return periods;
}

export function dueDateForPeriod(period: LeasePaymentPeriod, lease: LeaseRecord): string {
    if (lease.billingPeriod === 'weekly' || lease.billingPeriod === 'biweekly') {
        return lease.formData.LeasePaymentTiming === 'arretrato' ? period.endDate : period.startDate;
    }

    const base = lease.formData.LeasePaymentTiming === 'arretrato' ? period.endDate : period.startDate;
    const baseDate = parseDate(base);
    const preferred = preferredDayInMonth(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), lease.formData.LeasePaymentDay);
    if (lease.formData.LeasePaymentTiming === 'arretrato' && preferred < period.endDate) return period.endDate;
    return clampIsoDate(preferred, period.startDate, period.endDate);
}

function makePayment(lease: LeaseRecord, period: LeasePaymentPeriod, referenceDate: string): PaymentRecord {
    const dueDate = dueDateForPeriod(period, lease);
    const category = period.isFirstCustomPeriod ? 'rent-first' : 'rent';
    const amount = period.isFirstCustomPeriod
        ? Number((lease.formData.LeaseFirstBillAmount + lease.formData.LeaseFirstBillCharges).toFixed(2))
        : periodAmount(lease);
    const status = paymentStatus(dueDate, lease.formData.LeasePaymentMethod, referenceDate);
    const timestamp = new Date().toISOString();

    return {
        id: `payment-${category}-${lease.id}-${dueDate}`,
        propertyId: lease.propertyId,
        leaseId: lease.id,
        tenantId: lease.tenantIds[0] || null,
        type: 'income',
        category,
        amount,
        dueDate,
        paidDate: status.paidDate,
        status: status.status,
        description: period.isFirstCustomPeriod ? 'Prima rata personalizzata' : `Canone ${dueDate.slice(0, 7)}`,
        source: 'generated',
        accountingRole: 'revenue',
        notes: '',
        receiptNumber: null,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

export function buildLeasePaymentSchedule(lease: LeaseRecord, referenceDate = todayIso()): PaymentRecord[] {
    return buildLeasePaymentPeriods(lease, referenceDate).map((period) => makePayment(lease, period, referenceDate));
}

export function isGeneratedRentPayment(payment: PaymentRecord): boolean {
    return payment.type === 'income'
        && (payment.category === 'rent' || payment.category === 'rent-first')
        && (payment.id.startsWith('payment-rent-') || payment.id.startsWith('payment-lease-') || payment.id.startsWith('payment-rent-first-'));
}

function allowedHorizon(lease: LeaseRecord, referenceDate: string): string {
    return scheduleHorizon(lease, referenceDate);
}

export function assertGeneratedLeasePaymentSchedule(lease: LeaseRecord, payments: PaymentRecord[], referenceDate = todayIso()): void {
    const seen = new Set<string>();
    const horizon = allowedHorizon(lease, referenceDate);
    for (const payment of payments) {
        const key = `${payment.leaseId}|${payment.category}|${payment.dueDate}`;
        if (seen.has(key)) throw new Error(`Pagamento duplicato: ${key}`);
        seen.add(key);
        if (payment.leaseId !== lease.id) throw new Error('Pagamento con leaseId errato.');
        if (payment.propertyId !== lease.propertyId) throw new Error('Pagamento con propertyId errato.');
        if (payment.tenantId && !lease.tenantIds.includes(payment.tenantId)) throw new Error('Pagamento con tenantId non appartenente alla locazione.');
        if (payment.amount < 0) throw new Error('Pagamento con importo negativo.');
        if (payment.dueDate < lease.startDate) throw new Error('Pagamento prima della locazione.');
        if (payment.dueDate > horizon) throw new Error('Pagamento oltre l’orizzonte consentito.');
        if (payment.status === 'paid' && (!payment.paidDate || payment.dueDate > referenceDate || payment.paidDate > referenceDate)) throw new Error('Pagamento futuro marcato paid.');
        if (payment.status !== 'paid' && payment.paidDate) throw new Error('Pagamento non paid con paidDate.');
    }
}

export function ensureLeasePaymentSchedule(database: LocalDatabase, lease: LeaseRecord, referenceDate = todayIso()): LocalDatabase {
    const existing = new Set(database.payments.map((payment) => `${payment.leaseId}|${payment.category}|${payment.dueDate}`));
    const missing = buildLeasePaymentSchedule(lease, referenceDate).filter((payment) => !existing.has(`${payment.leaseId}|${payment.category}|${payment.dueDate}`));
    assertGeneratedLeasePaymentSchedule(lease, missing, referenceDate);
    return { ...database, payments: [...database.payments, ...missing] };
}

export function ensureAllLeasePaymentSchedules(database: LocalDatabase, referenceDate = todayIso()): LocalDatabase {
    return database.leases
        .filter((lease) => !lease.archived && lease.status === 'attiva' && lease.formData.LeaseRinnovoTacito && ['current', 'future'].includes(classifyLease(lease, referenceDate)))
        .reduce((next, lease) => ensureLeasePaymentSchedule(next, lease, referenceDate), database);
}

function addActivity(lease: LeaseRecord, description: string): LeaseRecord {
    return {
        ...lease,
        updatedAt: new Date().toISOString(),
        activity: [...lease.activity, { id: generateId('lease-activity'), type: 'payment', description, createdAt: new Date().toISOString() }],
    };
}

function assertIso(value: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new LeasePaymentOperationError('Data non valida.');
}

function statusFor(dueDate: string, paidDate: string | null, referenceDate = todayIso()): Pick<PaymentRecord, 'status' | 'paidDate'> {
    if (paidDate) return { status: 'paid', paidDate };
    return { status: dueDate < referenceDate ? 'late' : 'pending', paidDate: null };
}

function nextReceiptNumber(payments: PaymentRecord[], paidDate: string): string {
    const year = paidDate.slice(0, 4);
    const max = payments
        .map((payment) => payment.receiptNumber || '')
        .map((value) => value.match(/^RC-(\d{4})-(\d{4})$/))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .filter((match) => match[1] === year)
        .reduce((highest, match) => Math.max(highest, Number(match[2])), 0);
    return `RC-${year}-${String(max + 1).padStart(4, '0')}`;
}

export function listPaymentsByLeaseId(leaseId: string): PaymentRecord[] {
    return getJsonDb().payments.filter((payment) => payment.leaseId === leaseId);
}

export function getPaymentById(id: string): PaymentRecord | null {
    return getJsonDb().payments.find((payment) => payment.id === id) || null;
}

export interface ManualPaymentInput {
    leaseId: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    dueDate: string;
    description: string;
    notes: string;
    paidDate: string | null;
}

export function createManualPayment(input: ManualPaymentInput): PaymentRecord {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === input.leaseId);
    if (!lease) throw new LeaseNotFoundError();
    if (input.amount <= 0) throw new LeasePaymentOperationError('Inserisci un importo maggiore di zero.');
    assertIso(input.dueDate);
    if (input.paidDate) assertIso(input.paidDate);
    if (input.category === 'deposit' || input.category === 'deposit_return') throw new LeasePaymentOperationError('Usa la sezione deposito per questa categoria.');
    const now = new Date().toISOString();
    const paid = statusFor(input.dueDate, input.paidDate);
    const record: PaymentRecord = {
        id: generateId('payment-manual'),
        propertyId: lease.propertyId,
        leaseId: lease.id,
        tenantId: lease.tenantIds[0] || null,
        type: input.type,
        category: input.category,
        amount: input.amount,
        dueDate: input.dueDate,
        paidDate: paid.paidDate,
        status: paid.status,
        description: input.description,
        source: 'manual',
        accountingRole: input.type === 'expense' ? 'expense' : 'revenue',
        notes: input.notes,
        receiptNumber: paid.status === 'paid' && input.type === 'income' ? nextReceiptNumber(db.payments, input.paidDate as string) : null,
        createdAt: now,
        updatedAt: now,
    };
    const leases = db.leases.map((item) => item.id === lease.id ? addActivity(item, 'Pagamento manuale creato.') : item);
    return saveJsonDb({ ...db, leases, payments: [...db.payments, record] }).payments.find((payment) => payment.id === record.id) as PaymentRecord;
}

export function updateManualPayment(id: string, input: Omit<ManualPaymentInput, 'leaseId'>): PaymentRecord {
    const db = getJsonDb();
    const payment = db.payments.find((item) => item.id === id);
    if (!payment) throw new LeasePaymentNotFoundError();
    if (payment.source !== 'manual') throw new LeasePaymentOperationError('Puoi modificare solo pagamenti manuali.');
    if (input.amount <= 0) throw new LeasePaymentOperationError('Inserisci un importo maggiore di zero.');
    if (input.category === 'deposit' || input.category === 'deposit_return') throw new LeasePaymentOperationError('Categoria non consentita per un pagamento manuale.');
    const paid = statusFor(input.dueDate, input.paidDate);
    const next: PaymentRecord = {
        ...payment,
        type: input.type,
        category: input.category,
        amount: input.amount,
        dueDate: input.dueDate,
        paidDate: paid.paidDate,
        status: paid.status,
        description: input.description,
        notes: input.notes,
        accountingRole: input.type === 'expense' ? 'expense' : 'revenue',
        receiptNumber: paid.status === 'paid' && input.type === 'income' ? payment.receiptNumber || nextReceiptNumber(db.payments, input.paidDate as string) : payment.receiptNumber,
        updatedAt: new Date().toISOString(),
    };
    const leases = db.leases.map((lease) => lease.id === payment.leaseId ? addActivity(lease, 'Pagamento manuale aggiornato.') : lease);
    return saveJsonDb({ ...db, leases, payments: db.payments.map((item) => item.id === id ? next : item) }).payments.find((item) => item.id === id) as PaymentRecord;
}

export function deleteManualPayment(id: string): boolean {
    const db = getJsonDb();
    const payment = db.payments.find((item) => item.id === id);
    if (!payment) throw new LeasePaymentNotFoundError();
    if (payment.source !== 'manual' || payment.status === 'paid') throw new LeasePaymentOperationError('Puoi eliminare solo pagamenti manuali non incassati.');
    const leases = db.leases.map((lease) => lease.id === payment.leaseId ? addActivity(lease, 'Pagamento manuale eliminato.') : lease);
    saveJsonDb({ ...db, leases, payments: db.payments.filter((item) => item.id !== id) });
    return true;
}

export function markPaymentPaid(id: string, paidDate: string): PaymentRecord {
    assertIso(paidDate);
    if (paidDate > todayIso()) throw new LeasePaymentOperationError('La data pagamento non può essere futura.');
    const db = getJsonDb();
    const payment = db.payments.find((item) => item.id === id);
    if (!payment) throw new LeasePaymentNotFoundError();
    if (payment.source === 'generated' && payment.dueDate > todayIso()) throw new LeasePaymentOperationError('Una rata futura non può essere incassata.');
    const next = { ...payment, status: 'paid' as const, paidDate, receiptNumber: payment.receiptNumber || (payment.accountingRole === 'revenue' ? nextReceiptNumber(db.payments, paidDate) : null), updatedAt: new Date().toISOString() };
    const leases = db.leases.map((lease) => lease.id === payment.leaseId ? addActivity(lease, 'Pagamento segnato come pagato.') : lease);
    return saveJsonDb({ ...db, leases, payments: db.payments.map((item) => item.id === id ? next : item) }).payments.find((item) => item.id === id) as PaymentRecord;
}

export function markPaymentUnpaid(id: string): PaymentRecord {
    const db = getJsonDb();
    const payment = db.payments.find((item) => item.id === id);
    if (!payment) throw new LeasePaymentNotFoundError();
    const next = { ...payment, ...statusFor(payment.dueDate, null), updatedAt: new Date().toISOString() };
    const leases = db.leases.map((lease) => lease.id === payment.leaseId ? addActivity(lease, 'Pagamento riportato a non pagato.') : lease);
    return saveJsonDb({ ...db, leases, payments: db.payments.map((item) => item.id === id ? next : item) }).payments.find((item) => item.id === id) as PaymentRecord;
}

export function ensureLeaseDepositPayment(database: LocalDatabase, lease: LeaseRecord, referenceDate = todayIso()): LocalDatabase {
    if (lease.depositAmount <= 0) return database;
    const id = `payment-deposit-${lease.id}`;
    const dueDate = lease.formData.LeaseDepositDate || lease.startDate;
    const existing = database.payments.find((payment) => payment.id === id);
    const status = lease.formData.LeaseDepositType === 'versato' && dueDate <= referenceDate ? { status: 'paid' as const, paidDate: dueDate } : statusFor(dueDate, null, referenceDate);
    if (existing?.status === 'paid') {
        return { ...database, leases: database.leases.map((item) => item.id === lease.id ? { ...item, financialState: { ...item.financialState, depositPaymentId: id } } : item) };
    }
    const now = new Date().toISOString();
    const payment: PaymentRecord = {
        id,
        propertyId: lease.propertyId,
        leaseId: lease.id,
        tenantId: lease.tenantIds[0] || null,
        type: 'income',
        category: 'deposit',
        amount: lease.depositAmount,
        dueDate,
        paidDate: status.paidDate,
        status: status.status,
        description: 'Deposito cauzionale',
        source: 'deposit',
        accountingRole: 'deposit',
        notes: '',
        receiptNumber: null,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
    };
    const payments = existing ? database.payments.map((item) => item.id === id ? payment : item) : [...database.payments, payment];
    const leases = database.leases.map((item) => item.id === lease.id ? { ...item, financialState: { ...item.financialState, depositPaymentId: id } } : item);
    return { ...database, leases, payments };
}

export function registerDepositReturn(leaseId: string, date: string): PaymentRecord {
    assertIso(date);
    if (date > todayIso()) throw new LeaseDepositError('La data restituzione non può essere futura.');
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === leaseId);
    if (!lease) throw new LeaseNotFoundError();
    const deposit = db.payments.find((payment) => payment.id === `payment-deposit-${leaseId}` && payment.status === 'paid');
    if (!deposit) throw new LeaseDepositError('Incassa il deposito prima di registrare la restituzione.');
    const id = `payment-deposit-return-${leaseId}`;
    if (db.payments.some((payment) => payment.id === id)) throw new LeaseDepositError('La restituzione del deposito è già registrata.');
    const now = new Date().toISOString();
    const payment: PaymentRecord = {
        id,
        propertyId: lease.propertyId,
        leaseId,
        tenantId: lease.tenantIds[0] || null,
        type: 'expense',
        category: 'deposit_return',
        amount: deposit.amount,
        dueDate: date,
        paidDate: date,
        status: 'paid',
        description: 'Restituzione deposito cauzionale',
        source: 'deposit_return',
        accountingRole: 'deposit',
        notes: '',
        receiptNumber: null,
        createdAt: now,
        updatedAt: now,
    };
    const leases = db.leases.map((item) => item.id === leaseId ? addActivity({ ...item, financialState: { ...item.financialState, depositReturnPaymentId: id } }, 'Deposito restituito.') : item);
    return saveJsonDb({ ...db, leases, payments: [...db.payments, payment] }).payments.find((item) => item.id === id) as PaymentRecord;
}

export function applyPrepaidRent(leaseId: string, paymentIds: string[], allocationDate: string): LeaseRecord {
    assertIso(allocationDate);
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === leaseId);
    if (!lease) throw new LeaseNotFoundError();
    const uniqueIds = Array.from(new Set(paymentIds));
    const payments = uniqueIds.map((id) => db.payments.find((payment) => payment.id === id));
    if (payments.some((payment) => !payment || payment.leaseId !== leaseId || payment.source !== 'generated' || !['rent', 'rent-first'].includes(payment.category) || payment.status === 'paid')) {
        throw new LeasePrepaidRentError('Seleziona solo rate affitto non pagate.');
    }
    const already = new Set(lease.financialState.prepaidAllocations.map((item) => item.paymentId));
    if (uniqueIds.some((id) => already.has(id))) throw new LeasePrepaidRentError('Una rata selezionata è già allocata.');
    const amount = (payments as PaymentRecord[]).reduce((sum, payment) => sum + payment.amount, 0);
    const available = Math.max(0, (lease.formData.LeasePrepaidRent || 0) - lease.financialState.prepaidAppliedAmount);
    if (amount <= 0 || amount > available) throw new LeasePrepaidRentError('Importo prepagato insufficiente.');
    const allocations = uniqueIds.map((paymentId) => ({ paymentId, amount: (payments as PaymentRecord[]).find((payment) => payment.id === paymentId)?.amount || 0, allocatedAt: allocationDate, appliedAt: null }));
    const nextLease = addActivity({
        ...lease,
        financialState: {
            ...lease.financialState,
            prepaidAppliedAmount: lease.financialState.prepaidAppliedAmount + amount,
            prepaidAllocations: [...lease.financialState.prepaidAllocations, ...allocations],
        },
    }, 'Affitto prepagato allocato.');
    return saveJsonDb({ ...db, leases: db.leases.map((item) => item.id === leaseId ? nextLease : item) }).leases.find((item) => item.id === leaseId) as LeaseRecord;
}

export function reconcilePrepaidAllocations(database: LocalDatabase, referenceDate = todayIso()): LocalDatabase {
    let payments = [...database.payments];
    const leases = database.leases.map((lease) => {
        let changed = false;
        const prepaidAllocations = lease.financialState.prepaidAllocations.map((allocation) => {
            if (allocation.appliedAt) return allocation;
            const payment = payments.find((item) => item.id === allocation.paymentId);
            if (!payment || payment.dueDate > referenceDate) return allocation;
            payments = payments.map((item) => item.id === payment.id ? { ...item, status: 'paid', paidDate: item.dueDate, receiptNumber: item.receiptNumber || nextReceiptNumber(payments, item.dueDate), updatedAt: new Date().toISOString() } : item);
            changed = true;
            return { ...allocation, appliedAt: referenceDate };
        });
        return changed ? { ...lease, financialState: { ...lease.financialState, prepaidAllocations } } : lease;
    });
    return { ...database, leases, payments };
}
