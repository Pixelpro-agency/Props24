import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPropertyValues } from '../../src/components/property-form/schema';
import {
  defaultLeaseValues,
  type LeaseFormData,
} from '../../src/landlord/leases/schema/leaseFormSchema';
import type {
  ContactRecord,
  LeaseRecord,
  LocalDatabase,
  PropertyRecord,
  TenantRecord,
} from '../../src/db/database.types';
import type {
  ContactCreateInput,
  ContactUpdateInput,
} from '../../src/db/contactRepository.port';
import {
  installJsonDbWindow,
  MemoryStorage,
  uninstallJsonDbWindow,
} from './jsonDbStorageHarness';

const ACCOUNT_ID = 'user-001';
const ACCOUNT_KEY = 'props24.localDb.user-001';
const NOW = '2026-06-15T12:00:00.000Z';
const EARLIER = '2026-01-01T00:00:00.000Z';

function contact(overrides: Partial<ContactRecord> = {}): ContactRecord {
  return {
    id: 'contact-existing',
    type: 'person',
    companyName: '',
    firstName: 'Mario',
    lastName: 'Rossi',
    birthDate: '',
    birthPlace: '',
    fiscalCode: '',
    vatNumber: '',
    email: 'mario@example.test',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: 'IT',
    notes: '',
    archived: false,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    ...overrides,
  };
}

function emptyDatabase(contacts: ContactRecord[] = [contact()]): LocalDatabase {
  return {
    meta: {
      schemaVersion: 3,
      seedVersion: 1,
      createdAt: EARLIER,
      updatedAt: EARLIER,
      source: 'migration-v2',
    },
    properties: [],
    buildings: [],
    tenants: [],
    leases: [],
    payments: [],
    contacts,
    documents: [],
    reservations: [],
    catalogs: [],
    inventory: [],
    maintenance: [],
    tasks: [],
    notes: [],
    messages: [],
    candidates: [],
    settings: {},
    userProfile: {},
    drafts: {
      tenantForm: null,
      propertyForm: null,
      leaseForm: null,
    },
  };
}

function linkedDatabase(): LocalDatabase {
  const linkedContact = contact({ id: 'contact-linked' });
  const property = {
    id: 'property-linked',
    createdAt: EARLIER,
    updatedAt: EARLIER,
    archived: false,
    formData: {
      ...defaultPropertyValues,
      PropertyTitle: 'Unità collegata',
      PropertyAddress: 'Via Roma 1',
      PropertyCity: 'Milano',
      PropertyPostalCode: '20100',
    },
    relations: {
      buildingId: null,
      tenantIds: ['tenant-linked'],
      leaseIds: ['lease-linked'],
    },
    notes: [],
    activities: [],
  } satisfies PropertyRecord;
  const tenant = {
    id: 'tenant-linked',
    createdAt: EARLIER,
    updatedAt: EARLIER,
    type: 'person',
    photo: null,
    avatarColor: '#000000',
    title: 'Mr',
    firstName: 'Luigi',
    middleName: '',
    lastName: 'Verdi',
    birthDate: '',
    birthPlace: '',
    nationality: 'IT',
    fiscalCode: '',
    vatNumberPersonal: '',
    profession: '',
    monthlyIncome: null,
    idType: '',
    idNumber: '',
    idExpiry: '',
    identityDocumentFile: null,
    identityDocumentBackFile: null,
    companyName: '',
    vatNumber: '',
    siret: '',
    capital: '',
    companyDescription: '',
    companyRegistryFile: null,
    email: '',
    emailSecondary: '',
    mobilePhone: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    zip: '',
    state: '',
    country: 'IT',
    proEmployer: '',
    proAddress: '',
    proCity: '',
    proZip: '',
    proState: '',
    proCountry: '',
    proPhone: '',
    bankName: '',
    bankAddress: '',
    bankCity: '',
    bankZip: '',
    bankCountry: '',
    bankIBAN: '',
    bankSwiftBic: '',
    leaveAddress: '',
    notes: '',
    status: 'attivo',
    archived: false,
    leaseIds: ['lease-linked'],
    guarantors: [],
    emergencyContacts: [],
    documents: [],
    invitation: {
      status: 'not_sent',
      email: '',
      sentAt: null,
      acceptedAt: null,
    },
  } satisfies TenantRecord;
  const leaseFormData = {
    ...defaultLeaseValues,
    PropertyID: property.id,
    LeaseType: 'residential',
    LeaseTenantIds: [tenant.id],
    LeaseGarantIds: [linkedContact.id],
    LeaseStartDate: '2026-01-01',
    LeaseEndDate: '2026-12-31',
    LeaseBillingPeriod: 'monthly',
    LeaseRentHC: 1000,
    LeaseMaintenance: 0,
    LeaseDeposit: 0,
    LeaseMonthlyAmount: 1000,
  } satisfies LeaseFormData;
  const lease = {
    id: 'lease-linked',
    propertyId: property.id,
    tenantIds: [tenant.id],
    guarantorIds: [linkedContact.id],
    leaseType: leaseFormData.LeaseType,
    leaseTypeLabel: 'Residenziale',
    startDate: leaseFormData.LeaseStartDate,
    endDate: leaseFormData.LeaseEndDate,
    status: 'attiva',
    rentAmount: leaseFormData.LeaseRentHC,
    utilitiesAmount: leaseFormData.LeaseMaintenance,
    depositAmount: leaseFormData.LeaseDeposit,
    billingPeriod: leaseFormData.LeaseBillingPeriod,
    formData: leaseFormData,
    archived: false,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    notes: '',
    activity: [],
    signatureProcess: null,
    termination: null,
    financialState: {
      depositPaymentId: null,
      depositReturnPaymentId: null,
      prepaidAppliedAmount: 0,
      prepaidAllocations: [],
    },
  } satisfies LeaseRecord;
  return {
    ...emptyDatabase([linkedContact]),
    properties: [property],
    tenants: [tenant],
    leases: [lease],
  };
}

function personInput(overrides: Partial<ContactCreateInput> = {}): ContactCreateInput {
  return {
    type: 'person',
    companyName: '',
    firstName: 'Anna',
    lastName: 'Bianchi',
    birthDate: '',
    birthPlace: '',
    fiscalCode: '',
    vatNumber: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: 'IT',
    notes: '',
    ...overrides,
  };
}

async function arrange(database = emptyDatabase()) {
  const storage = new MemoryStorage({
    [ACCOUNT_KEY]: JSON.stringify(database),
  });
  installJsonDbWindow(storage);
  vi.resetModules();
  const jsonDb = await import('../../src/db/jsonDb');
  jsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
  jsonDb.initializeJsonDb();
  const { createLocalContactRepository } = await import('../../src/db/localContactRepository');
  return {
    storage,
    jsonDb,
    repository: createLocalContactRepository(),
  };
}

describe('local contact repository adapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('lists contacts asynchronously without writing or exposing the source array', async () => {
    const fixture = emptyDatabase();
    const { repository, storage } = await arrange(fixture);
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    const result = await repository.list();

    expect(result).toEqual(fixture.contacts);
    expect(result).not.toBe(fixture.contacts);
    expect(result).not.toHaveProperty('properties');
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
  });

  it('gets an existing contact and returns null for a missing id without writing', async () => {
    const { repository, storage } = await arrange();
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    await expect(repository.getById('contact-existing')).resolves.toMatchObject({ id: 'contact-existing' });
    await expect(repository.getById('contact-missing')).resolves.toBeNull();
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
  });

  it('creates and rereads a person with one write without mutating input', async () => {
    const { repository, storage } = await arrange(emptyDatabase([]));
    const input = personInput();
    const original = structuredClone(input);
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    const created = await repository.create(input);

    expect(created).toMatchObject({
      type: 'person',
      archived: false,
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(created.id).toMatch(/^contact-/);
    await expect(repository.getById(created.id)).resolves.toEqual(created);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
    expect(input).toEqual(original);
  });

  it('creates and persists a company with one write without mutating input', async () => {
    const { repository, storage } = await arrange(emptyDatabase([]));
    const input = personInput({
      type: 'company',
      companyName: 'Contatti Srl',
      firstName: '',
      lastName: '',
    });
    const original = structuredClone(input);
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    const created = await repository.create(input);

    expect(created).toMatchObject({ type: 'company', companyName: 'Contatti Srl' });
    await expect(repository.getById(created.id)).resolves.toEqual(created);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
    expect(input).toEqual(original);
  });

  it('rejects invalid creation without writing or mutating input', async () => {
    const { repository, storage } = await arrange(emptyDatabase([]));
    const input = personInput({ firstName: '' });
    const original = structuredClone(input);
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    await expect(repository.create(input)).rejects.toThrow();

    await expect(repository.list()).resolves.toHaveLength(0);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
    expect(input).toEqual(original);
  });

  it('partially updates and rereads a contact with one write without mutating patch', async () => {
    const { repository, storage } = await arrange();
    const patch: ContactUpdateInput = { email: 'nuova@example.test', notes: 'Aggiornato' };
    const original = structuredClone(patch);
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    const updated = await repository.update('contact-existing', patch);

    expect(updated).toMatchObject({
      id: 'contact-existing',
      firstName: 'Mario',
      email: 'nuova@example.test',
      notes: 'Aggiornato',
      archived: false,
      createdAt: EARLIER,
      updatedAt: NOW,
    });
    await expect(repository.getById(updated.id)).resolves.toEqual(updated);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
    expect(patch).toEqual(original);
  });

  it('rejects updating a missing contact with the domain error and no write', async () => {
    const { repository, storage } = await arrange();
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    await expect(repository.update('contact-missing', { notes: 'Assente' }))
      .rejects.toMatchObject({ name: 'LeaseContactNotFoundError' });
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
  });

  it('archives and persists a contact with one write', async () => {
    const { repository, storage } = await arrange();
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    const archived = await repository.archive('contact-existing');

    expect(archived).toMatchObject({ id: 'contact-existing', archived: true, updatedAt: NOW });
    await expect(repository.getById(archived.id)).resolves.toEqual(archived);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
  });

  it('blocks deleting a linked contact with the domain error and no write', async () => {
    const { repository, storage } = await arrange(linkedDatabase());
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    await expect(repository.canDelete('contact-linked')).resolves.toMatchObject({
      canDelete: false,
      reason: expect.any(String),
    });
    await expect(repository.delete('contact-linked')).rejects.toMatchObject({
      name: 'LeaseContactInUseError',
    });
    await expect(repository.getById('contact-linked')).resolves.not.toBeNull();
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
  });

  it('deletes an unlinked contact with one write and resolves undefined', async () => {
    const { repository, storage } = await arrange();
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    await expect(repository.delete('contact-existing')).resolves.toBeUndefined();

    await expect(repository.getById('contact-existing')).resolves.toBeNull();
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
  });
});
