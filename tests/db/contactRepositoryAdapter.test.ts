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
const SECOND_ACCOUNT_ID = 'user-002';
const SECOND_ACCOUNT_KEY = 'props24.localDb.user-002';
const THIRD_ACCOUNT_ID = 'user-003';
const THIRD_ACCOUNT_KEY = 'props24.localDb.user-003';
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
      schemaVersion: 4,
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
    drafts: [],
  };
}

function linkedDatabase(linkedContactId = 'contact-linked'): LocalDatabase {
  const linkedContact = contact({ id: linkedContactId });
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
    repository: createLocalContactRepository({ accountId: ACCOUNT_ID }),
  };
}

function storedDatabase(storage: MemoryStorage, key: string): LocalDatabase {
  const raw = storage.getItem(key);
  if (!raw) throw new Error(`Database account mancante: ${key}`);
  return JSON.parse(raw) as LocalDatabase;
}

function dispatchStorageEvent(key: string): void {
  const event = new Event('storage');
  Object.defineProperty(event, 'key', {
    configurable: true,
    value: key,
  });
  window.dispatchEvent(event);
}

async function arrangeAccounts(
  firstDatabase: LocalDatabase,
  secondDatabase: LocalDatabase,
) {
  const storage = new MemoryStorage({
    [ACCOUNT_KEY]: JSON.stringify(firstDatabase),
    [SECOND_ACCOUNT_KEY]: JSON.stringify(secondDatabase),
  });
  installJsonDbWindow(storage);
  vi.resetModules();
  const jsonDb = await import('../../src/db/jsonDb');
  jsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
  const { createLocalContactRepository } = await import('../../src/db/localContactRepository');
  const repository = createLocalContactRepository({ accountId: ACCOUNT_ID });
  jsonDb.setActiveDatabaseAccount(SECOND_ACCOUNT_ID);
  return { storage, jsonDb, repository };
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

  it('keeps reads bound to the captured account after the global account changes', async () => {
    const first = emptyDatabase([contact({ id: 'contact-user-001', firstName: 'Uno' })]);
    const second = emptyDatabase([contact({ id: 'contact-user-002', firstName: 'Due' })]);
    const { repository, storage, jsonDb } = await arrangeAccounts(first, second);
    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;

    await expect(repository.list()).resolves.toEqual(first.contacts);
    await expect(repository.getById('contact-user-001')).resolves.toMatchObject({ firstName: 'Uno' });
    await expect(repository.getById('contact-user-002')).resolves.toBeNull();
    expect(jsonDb.getJsonDb().contacts).toEqual(second.contacts);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
  });

  it('creates only in the captured account after the global account changes', async () => {
    const first = emptyDatabase([contact({ id: 'contact-user-001' })]);
    const second = emptyDatabase([contact({ id: 'contact-user-002' })]);
    const { repository, storage, jsonDb } = await arrangeAccounts(first, second);
    const input = personInput({ firstName: 'Scoped' });
    const original = structuredClone(input);
    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;

    const created = await repository.create(input);

    expect(storedDatabase(storage, ACCOUNT_KEY).contacts).toContainEqual(created);
    expect(storedDatabase(storage, SECOND_ACCOUNT_KEY)).toEqual(second);
    expect(jsonDb.getJsonDb().contacts).toEqual(second.contacts);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites + 1);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
    expect(input).toEqual(original);
  });

  it('updates only the shared id in the captured account', async () => {
    const sharedId = 'contact-shared';
    const first = emptyDatabase([contact({ id: sharedId, notes: 'user-001' })]);
    const second = emptyDatabase([contact({ id: sharedId, notes: 'user-002' })]);
    const { repository, storage } = await arrangeAccounts(first, second);
    const patch: ContactUpdateInput = { notes: 'updated-user-001' };
    const original = structuredClone(patch);
    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;

    await repository.update(sharedId, patch);

    expect(storedDatabase(storage, ACCOUNT_KEY).contacts[0].notes).toBe('updated-user-001');
    expect(storedDatabase(storage, SECOND_ACCOUNT_KEY).contacts[0].notes).toBe('user-002');
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites + 1);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
    expect(patch).toEqual(original);
  });

  it('archives only the shared id in the captured account', async () => {
    const sharedId = 'contact-shared';
    const first = emptyDatabase([contact({ id: sharedId })]);
    const second = emptyDatabase([contact({ id: sharedId })]);
    const { repository, storage } = await arrangeAccounts(first, second);
    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;

    await repository.archive(sharedId);

    expect(storedDatabase(storage, ACCOUNT_KEY).contacts[0].archived).toBe(true);
    expect(storedDatabase(storage, SECOND_ACCOUNT_KEY).contacts[0].archived).toBe(false);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites + 1);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
  });

  it('keeps delete and its guard bound to the captured account', async () => {
    const sharedId = 'contact-shared';
    const first = linkedDatabase(sharedId);
    const second = emptyDatabase([contact({ id: sharedId })]);
    const { repository, storage } = await arrangeAccounts(first, second);
    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;

    await expect(repository.canDelete(sharedId)).resolves.toMatchObject({
      canDelete: false,
      reason: expect.any(String),
    });
    await expect(repository.delete(sharedId)).rejects.toMatchObject({
      name: 'LeaseContactInUseError',
    });
    expect(storedDatabase(storage, ACCOUNT_KEY).contacts).toHaveLength(1);
    expect(storedDatabase(storage, SECOND_ACCOUNT_KEY).contacts).toHaveLength(1);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
  });

  it('initializes a non-active secondary account without changing the active account', async () => {
    const second = emptyDatabase([contact({ id: 'contact-user-002' })]);
    const storage = new MemoryStorage({
      [SECOND_ACCOUNT_KEY]: JSON.stringify(second),
    });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    jsonDb.setActiveDatabaseAccount(SECOND_ACCOUNT_ID);
    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;
    const { createLocalContactRepository } = await import('../../src/db/localContactRepository');
    const repository = createLocalContactRepository({ accountId: THIRD_ACCOUNT_ID });

    await expect(repository.list()).resolves.toEqual([]);

    expect(storedDatabase(storage, THIRD_ACCOUNT_KEY).contacts).toEqual([]);
    expect(storage.writesFor(THIRD_ACCOUNT_KEY)).toHaveLength(1);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
    expect(jsonDb.getJsonDb().contacts).toEqual(second.contacts);
  });

  it('notifies once after a local create in the captured account', async () => {
    const first = emptyDatabase([]);
    const second = emptyDatabase([contact({ id: 'contact-user-002' })]);
    const { repository, storage } = await arrangeAccounts(first, second);
    const callback = vi.fn();
    repository.subscribe(callback);
    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;

    await repository.list();
    expect(callback).not.toHaveBeenCalled();
    await repository.create(personInput());

    expect(callback).toHaveBeenCalledTimes(1);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites + 1);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
  });

  it('notifies once for each update archive and delete mutation', async () => {
    const { repository, storage } = await arrange();
    const callback = vi.fn();
    repository.subscribe(callback);
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    await repository.update('contact-existing', { notes: 'Aggiornato' });
    expect(callback).toHaveBeenCalledTimes(1);
    await repository.archive('contact-existing');
    expect(callback).toHaveBeenCalledTimes(2);
    await repository.delete('contact-existing');
    expect(callback).toHaveBeenCalledTimes(3);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 3);
  });

  it('notifies an account-scoped subscriber after a matching legacy write', async () => {
    const { repository, storage } = await arrange(emptyDatabase([]));
    const callback = vi.fn();
    repository.subscribe(callback);
    const writes = storage.writesFor(ACCOUNT_KEY).length;
    const { createContact } = await import('../../src/db/contactRepository');

    const created = createContact(personInput());

    expect(callback).toHaveBeenCalledTimes(1);
    expect(storedDatabase(storage, ACCOUNT_KEY).contacts).toContainEqual(created);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
  });

  it('does not notify after failed validation', async () => {
    const { repository, storage } = await arrange(emptyDatabase([]));
    const callback = vi.fn();
    repository.subscribe(callback);
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    await expect(repository.create(personInput({ firstName: '' }))).rejects.toThrow();

    expect(callback).not.toHaveBeenCalled();
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
    expect(storedDatabase(storage, ACCOUNT_KEY).contacts).toEqual([]);
  });

  it('does not notify when delete is blocked', async () => {
    const { repository, storage } = await arrange(linkedDatabase());
    const callback = vi.fn();
    repository.subscribe(callback);
    const writes = storage.writesFor(ACCOUNT_KEY).length;

    await expect(repository.delete('contact-linked')).rejects.toMatchObject({
      name: 'LeaseContactInUseError',
    });

    expect(callback).not.toHaveBeenCalled();
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
    expect(storedDatabase(storage, ACCOUNT_KEY).contacts).toHaveLength(1);
  });

  it('unsubscribe blocks subsequent local and storage notifications', async () => {
    const { repository } = await arrange(emptyDatabase([]));
    const callback = vi.fn();
    const unsubscribe = repository.subscribe(callback);

    unsubscribe();
    await repository.create(personInput());
    dispatchStorageEvent(ACCOUNT_KEY);

    expect(callback).not.toHaveBeenCalled();
    await expect(repository.list()).resolves.toHaveLength(1);
  });

  it('filters storage notifications by the captured account key', async () => {
    const first = emptyDatabase([contact({ id: 'contact-user-001' })]);
    const second = emptyDatabase([contact({ id: 'contact-user-002' })]);
    const { repository, jsonDb } = await arrangeAccounts(first, second);
    const callback = vi.fn();
    repository.subscribe(callback);

    dispatchStorageEvent(SECOND_ACCOUNT_KEY);
    expect(callback).not.toHaveBeenCalled();
    dispatchStorageEvent(ACCOUNT_KEY);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(jsonDb.getJsonDb().contacts).toEqual(second.contacts);
  });

  it('keeps subscriptions isolated across two captured accounts', async () => {
    const first = emptyDatabase([]);
    const second = emptyDatabase([]);
    const { repository: repositoryOne, storage } = await arrangeAccounts(first, second);
    const { createLocalContactRepository } = await import('../../src/db/localContactRepository');
    const repositoryTwo = createLocalContactRepository({ accountId: SECOND_ACCOUNT_ID });
    const callbackOne = vi.fn();
    const callbackTwo = vi.fn();
    repositoryOne.subscribe(callbackOne);
    repositoryTwo.subscribe(callbackTwo);
    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;

    await repositoryOne.create(personInput({ firstName: 'Uno' }));
    expect(callbackOne).toHaveBeenCalledTimes(1);
    expect(callbackTwo).not.toHaveBeenCalled();

    await repositoryTwo.create(personInput({ firstName: 'Due' }));
    expect(callbackOne).toHaveBeenCalledTimes(1);
    expect(callbackTwo).toHaveBeenCalledTimes(1);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites + 1);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites + 1);
  });
});
