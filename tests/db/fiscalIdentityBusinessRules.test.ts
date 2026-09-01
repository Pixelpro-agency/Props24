import { describe, expect, it } from 'vitest';
import {
    assertUniqueContactFiscalIdentity,
    assertUniqueTenantFiscalIdentity,
    findContactFiscalDuplicate,
    findTenantFiscalDuplicate,
    normalizeVatNumber,
} from '../../src/db/businessRules';
import { DuplicateContactFiscalIdentityError, DuplicateTenantFiscalIdentityError } from '../../src/db/databaseErrors';
import type { ContactRecord, LocalDatabase, TenantRecord } from '../../src/db/database.types';

const contact = (id: string, type: 'person' | 'company', fiscalCode = '', vatNumber = '', archived = false) => ({
    id, type, fiscalCode, vatNumber, archived,
} as ContactRecord);
const tenant = (id: string, type: 'person' | 'company', fiscalCode = '', companyFiscalCode = '', vatNumber = '', archived = false) => ({
    id, type, fiscalCode, companyFiscalCode, vatNumber, archived,
} as TenantRecord);
const database = (contacts: ContactRecord[] = [], tenants: TenantRecord[] = []) => ({ contacts, tenants } as LocalDatabase);

describe('business rules identità fiscale C3.1', () => {
    it('normalizza VAT con NFKC, whitespace removal e uppercase senza alterare punteggiatura/prefisso', () => {
        expect(normalizeVatNumber(' it １２３-45 ')).toBe('IT123-45');
        expect(normalizeVatNumber('')).toBe('');
    });

    it('Contact person usa solo CF, ignora VAT, vuoti e company con stesso valore', () => {
        const db = database([
            contact('person-1', 'person', ' rss 123 ', 'IGNORED', true),
            contact('company-1', 'company', 'CROSS', 'VAT-X'),
        ]);
        expect(findContactFiscalDuplicate(db, contact('new', 'person', 'RSS123', 'IGNORED-2'))).toMatchObject({ field: 'fiscalCode', record: { id: 'person-1' } });
        expect(findContactFiscalDuplicate(db, contact('new', 'person', '', 'IGNORED'))).toBeNull();
        expect(findContactFiscalDuplicate(db, contact('new', 'person', 'CROSS'))).toBeNull();
    });

    it('Contact company usa CF e VAT, include archived, supporta exclude e dà priorità al CF', () => {
        const db = database([
            contact('company-1', 'company', 'CF-1', 'VAT-1', true),
            contact('company-2', 'company', 'CF-2', 'VAT-2'),
        ]);
        expect(findContactFiscalDuplicate(db, contact('new', 'company', 'cf-1', 'vat-2'))).toMatchObject({ field: 'fiscalCode', record: { id: 'company-1' } });
        expect(findContactFiscalDuplicate(db, contact('new', 'company', '', ' vat-2 '))).toMatchObject({ field: 'vatNumber', record: { id: 'company-2' } });
        expect(findContactFiscalDuplicate(db, contact('new', 'company', 'CF-1', 'VAT-1'), 'company-1')).toBeNull();
    });

    it('Tenant person usa solo CF; company usa CF ente/VAT e ignora CF rappresentante', () => {
        const db = database([], [
            tenant('person-1', 'person', 'PERSON-CF'),
            tenant('company-1', 'company', 'REP-SHARED', 'ENTITY-CF', 'ENTITY-VAT', true),
        ]);
        expect(findTenantFiscalDuplicate(db, tenant('new', 'person', ' person-cf '))).toMatchObject({ field: 'fiscalCode', record: { id: 'person-1' } });
        expect(findTenantFiscalDuplicate(db, tenant('new', 'company', 'OTHER-REP', 'entity-cf', 'other-vat'))).toMatchObject({ field: 'fiscalCode', record: { id: 'company-1' } });
        expect(findTenantFiscalDuplicate(db, tenant('new', 'company', 'OTHER-REP', '', ' entity-vat '))).toMatchObject({ field: 'vatNumber', record: { id: 'company-1' } });
        expect(findTenantFiscalDuplicate(db, tenant('new', 'company', 'REP-SHARED', 'OTHER-ENTITY', 'OTHER-VAT'))).toBeNull();
    });

    it('Tenant include archived, supporta exclude e dà priorità al CF ente', () => {
        const db = database([], [
            tenant('company-1', 'company', 'REP-1', 'ENTITY-1', 'VAT-1', true),
            tenant('company-2', 'company', 'REP-2', 'ENTITY-2', 'VAT-2'),
        ]);
        expect(findTenantFiscalDuplicate(db, tenant('new', 'company', '', 'ENTITY-1', 'VAT-2'))).toMatchObject({ field: 'fiscalCode', record: { id: 'company-1' } });
        expect(findTenantFiscalDuplicate(db, tenant('new', 'company', '', 'ENTITY-1', 'VAT-1'), 'company-1')).toBeNull();
    });

    it('assert espone field e ID del record esistente', () => {
        const db = database(
            [contact('contact-1', 'company', '', 'VAT-1')],
            [tenant('tenant-1', 'person', 'CF-1')],
        );
        expect(() => assertUniqueContactFiscalIdentity(db, contact('new', 'company', '', 'VAT-1'))).toThrow(DuplicateContactFiscalIdentityError);
        try { assertUniqueContactFiscalIdentity(db, contact('new', 'company', '', 'VAT-1')); } catch (error) {
            expect(error).toMatchObject({ name: 'DuplicateContactFiscalIdentityError', field: 'vatNumber', existingContactId: 'contact-1' });
        }
        expect(() => assertUniqueTenantFiscalIdentity(db, tenant('new', 'person', 'CF-1'))).toThrow(DuplicateTenantFiscalIdentityError);
        try { assertUniqueTenantFiscalIdentity(db, tenant('new', 'person', 'CF-1')); } catch (error) {
            expect(error).toMatchObject({ name: 'DuplicateTenantFiscalIdentityError', field: 'fiscalCode', existingTenantId: 'tenant-1' });
        }
    });

    it('Contact e Tenant non si vedono reciprocamente', () => {
        expect(findContactFiscalDuplicate(database([], [tenant('tenant-1', 'person', 'CROSS123')]), contact('new', 'person', 'CROSS123'))).toBeNull();
        expect(findTenantFiscalDuplicate(database([contact('contact-1', 'person', 'CROSS123')], []), tenant('new', 'person', 'CROSS123'))).toBeNull();
    });
});
