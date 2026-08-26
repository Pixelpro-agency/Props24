export class DuplicatePropertyIdentifierError extends Error {
    identifier: string;
    existingPropertyId: string;

    constructor(identifier: string, existingPropertyId: string) {
        super(`Esiste già un'unità con l'identificativo "${identifier}".`);
        this.name = 'DuplicatePropertyIdentifierError';
        this.identifier = identifier;
        this.existingPropertyId = existingPropertyId;
    }
}

export class DuplicatePropertyCadastralKeyError extends Error {
    readonly existingPropertyId: string;

    constructor(existingPropertyId: string) {
        super("Esiste già un'unità con gli stessi riferimenti catastali.");
        this.name = 'DuplicatePropertyCadastralKeyError';
        this.existingPropertyId = existingPropertyId;
    }
}

export class DuplicateBuildingIdentifierError extends Error {
    identifier: string;
    existingBuildingId: string;

    constructor(identifier: string, existingBuildingId: string) {
        super(`Esiste già un edificio con l'identificativo "${identifier}".`);
        this.name = 'DuplicateBuildingIdentifierError';
        this.identifier = identifier;
        this.existingBuildingId = existingBuildingId;
    }
}

export class DuplicateBuildingLocationError extends Error {
    existingBuildingId: string;

    constructor(existingBuildingId: string) {
        super('Esiste già un edificio allo stesso indirizzo.');
        this.name = 'DuplicateBuildingLocationError';
        this.existingBuildingId = existingBuildingId;
    }
}

export class BuildingNotFoundError extends Error {
    readonly buildingId: string;

    constructor(buildingId: string) {
        super(`Edificio non trovato: ${buildingId}.`);
        this.name = 'BuildingNotFoundError';
        this.buildingId = buildingId;
    }
}

export class BuildingDeleteBlockedError extends Error {
    readonly buildingId: string;
    readonly linkedPropertyIds: string[];

    constructor(buildingId: string, linkedPropertyIds: string[]) {
        super(`L'edificio ${buildingId} non può essere eliminato perché contiene unità collegate. L'archiviazione è l'alternativa sicura.`);
        this.name = 'BuildingDeleteBlockedError';
        this.buildingId = buildingId;
        this.linkedPropertyIds = [...linkedPropertyIds];
    }
}

export class PropertyNotFoundError extends Error {
    readonly propertyId: string;

    constructor(propertyId: string) {
        super(`Unità non trovata: ${propertyId}.`);
        this.name = 'PropertyNotFoundError';
        this.propertyId = propertyId;
    }
}

export interface PropertyDeleteBlocker {
    propertyId: string;
    leaseIds: string[];
    paymentIds: string[];
}

export class PropertyDeleteBlockedError extends Error {
    readonly blockers: PropertyDeleteBlocker[];
    readonly blockedPropertyIds: string[];

    constructor(blockers: PropertyDeleteBlocker[]) {
        super("Una o più unità non possono essere eliminate perché conservano storico o relazioni persistenti. L'archiviazione è l'alternativa sicura.");
        this.name = 'PropertyDeleteBlockedError';
        this.blockers = blockers.map((blocker) => ({
            propertyId: blocker.propertyId,
            leaseIds: [...blocker.leaseIds],
            paymentIds: [...blocker.paymentIds],
        }));
        this.blockedPropertyIds = this.blockers.map((blocker) => blocker.propertyId);
    }
}

export class PropertyBuildingArchivedError extends Error {
    readonly buildingId: string;

    constructor(buildingId: string) {
        super("L'edificio selezionato è archiviato. Ripristinalo prima di collegare nuove unità.");
        this.name = 'PropertyBuildingArchivedError';
        this.buildingId = buildingId;
    }
}

export class DuplicatePropertyLocationError extends Error {
    existingPropertyId: string;

    constructor(existingPropertyId: string) {
        super("Immobile già registrato. Esiste già un'unità con lo stesso indirizzo, città e CAP.");
        this.name = 'DuplicatePropertyLocationError';
        this.existingPropertyId = existingPropertyId;
    }
}

export class TenantInviteMissingEmailError extends Error {
    tenantId: string;

    constructor(tenantId: string) {
        super("L'inquilino non ha un indirizzo email per l'invito.");
        this.name = 'TenantInviteMissingEmailError';
        this.tenantId = tenantId;
    }
}

export class TenantStorageQuotaError extends Error {
    constructor() {
        super('Gli allegati superano il limite locale di 3MB per inquilino.');
        this.name = 'TenantStorageQuotaError';
    }
}

export class TenantDeleteBlockedByLeaseError extends Error {
    tenantId: string;

    constructor(tenantId: string) {
        super("Impossibile eliminare i dati!\nL'inquilino è associato ad una locazione.\nArchivia l'inquilino per conservarne lo storico.");
        this.name = 'TenantDeleteBlockedByLeaseError';
        this.tenantId = tenantId;
    }
}

export class TenantLeaseConflictError extends Error {
    tenantId: string;
    conflictingLeaseIds: string[];
    conflictingPropertyIds: string[];

    constructor(tenantId: string, conflictingLeaseIds: string[], conflictingPropertyIds: string[]) {
        super("L'inquilino risulta già assegnato a un'altra unità nel periodo selezionato.");
        this.name = 'TenantLeaseConflictError';
        this.tenantId = tenantId;
        this.conflictingLeaseIds = conflictingLeaseIds;
        this.conflictingPropertyIds = conflictingPropertyIds;
    }
}

export class LeasePropertyNotFoundError extends Error {
    constructor() {
        super('La proprietà selezionata non esiste o è archiviata.');
        this.name = 'LeasePropertyNotFoundError';
    }
}

export class LeaseTenantNotFoundError extends Error {
    constructor() {
        super('Uno o più inquilini selezionati non esistono o sono archiviati.');
        this.name = 'LeaseTenantNotFoundError';
    }
}

export class LeaseInvalidDateRangeError extends Error {
    constructor() {
        super('Le date della locazione non sono valide.');
        this.name = 'LeaseInvalidDateRangeError';
    }
}

export class LeaseTypeNotFoundError extends Error {
    constructor() {
        super('Il tipo di locazione selezionato non esiste.');
        this.name = 'LeaseTypeNotFoundError';
    }
}

export class LeaseStorageError extends Error {
    constructor(cause?: unknown) {
        super('Impossibile salvare la locazione nel database locale.');
        this.name = 'LeaseStorageError';
        this.cause = cause;
    }
}

export class LeaseNotFoundError extends Error {
    constructor() {
        super('Locazione non trovata.');
        this.name = 'LeaseNotFoundError';
    }
}

export class LeaseArchivedError extends Error {
    constructor() {
        super('Ripristina la locazione prima di modificarla.');
        this.name = 'LeaseArchivedError';
    }
}

export class LeaseLockedBySignatureError extends Error {
    constructor() {
        super('Annulla la procedura di firma locale prima di modificare il contratto.');
        this.name = 'LeaseLockedBySignatureError';
    }
}

export class LeaseInvalidStatusTransitionError extends Error {
    constructor(message = 'Cambio di stato non consentito per questa locazione.') {
        super(message);
        this.name = 'LeaseInvalidStatusTransitionError';
    }
}

export class LeaseUpdateConflictError extends Error {
    constructor(message = 'La modifica crea un conflitto con un’altra locazione.') {
        super(message);
        this.name = 'LeaseUpdateConflictError';
    }
}

export class LeasePaymentHistoryConflictError extends Error {
    constructor(message = 'La modifica non è consentita perché esistono movimenti storici o manuali collegati.') {
        super(message);
        this.name = 'LeasePaymentHistoryConflictError';
    }
}

export class LeaseDeleteBlockedError extends Error {
    reasons: string[];

    constructor(reasons: string[]) {
        super(`Impossibile eliminare la locazione: ${reasons.join(', ')}.`);
        this.name = 'LeaseDeleteBlockedError';
        this.reasons = reasons;
    }
}

export class LeaseDocumentNotFoundError extends Error {
    constructor() {
        super('Documento della locazione non trovato.');
        this.name = 'LeaseDocumentNotFoundError';
    }
}

export class LeaseDocumentDuplicateError extends Error {
    constructor() {
        super('Il documento è già collegato a questa locazione.');
        this.name = 'LeaseDocumentDuplicateError';
    }
}

export class LeaseDocumentQuotaError extends Error {
    constructor(message = 'Il documento supera i limiti locali consentiti.') {
        super(message);
        this.name = 'LeaseDocumentQuotaError';
    }
}

export class LeasePaymentNotFoundError extends Error {
    constructor() {
        super('Pagamento della locazione non trovato.');
        this.name = 'LeasePaymentNotFoundError';
    }
}

export class LeasePaymentOperationError extends Error {
    constructor(message = 'Operazione sul pagamento non consentita.') {
        super(message);
        this.name = 'LeasePaymentOperationError';
    }
}

export class LeaseContactNotFoundError extends Error {
    constructor() {
        super('Garante non trovato.');
        this.name = 'LeaseContactNotFoundError';
    }
}

export class LeaseContactInUseError extends Error {
    constructor() {
        super('Il contatto è collegato a una locazione e non può essere eliminato.');
        this.name = 'LeaseContactInUseError';
    }
}

export class LeaseSignatureError extends Error {
    constructor(message = 'Operazione di firma locale non riuscita.') {
        super(message);
        this.name = 'LeaseSignatureError';
    }
}

export class LeaseCommunicationError extends Error {
    constructor(message = 'Non è stato possibile preparare la comunicazione.') {
        super(message);
        this.name = 'LeaseCommunicationError';
    }
}

export class LeasePrepaidRentError extends Error {
    constructor(message = 'Affitto prepagato non applicabile.') {
        super(message);
        this.name = 'LeasePrepaidRentError';
    }
}

export class LeaseDepositError extends Error {
    constructor(message = 'Operazione sul deposito non consentita.') {
        super(message);
        this.name = 'LeaseDepositError';
    }
}

export type LocalStorageOperation = 'read' | 'write' | 'backup' | 'migration';

export class LocalStorageQuotaError extends Error {
    key?: string;
    operation: LocalStorageOperation;
    cause?: unknown;

    constructor(operation: LocalStorageOperation, key?: string, cause?: unknown) {
        super('Spazio locale del browser esaurito. Esporta i dati e libera spazio prima di salvare.');
        this.name = 'LocalStorageQuotaError';
        this.key = key;
        this.operation = operation;
        this.cause = cause;
    }
}

export function isQuotaExceededError(error: unknown): boolean {
    if (error instanceof LocalStorageQuotaError) return true;
    if (error instanceof DOMException) {
        return error.name === 'QuotaExceededError'
            || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
            || error.code === 22
            || error.code === 1014;
    }
    if (typeof error === 'object' && error !== null) {
        const record = error as { name?: unknown; code?: unknown; number?: unknown };
        return record.name === 'QuotaExceededError'
            || record.name === 'NS_ERROR_DOM_QUOTA_REACHED'
            || record.code === 22
            || record.code === 1014
            || record.number === -2147024882;
    }
    return false;
}

export class LeaseInsuranceDocumentLinkError extends Error {
    constructor(message = 'Il documento selezionato non appartiene a questa locazione.') {
        super(message);
        this.name = 'LeaseInsuranceDocumentLinkError';
    }
}

export class DraftInvalidKeyError extends Error {
    constructor(message = 'La chiave della bozza non è valida.', cause?: unknown) {
        super(message);
        this.name = 'DraftInvalidKeyError';
        this.cause = cause;
    }
}

export class DraftPayloadValidationError extends Error {
    constructor(cause?: unknown) {
        super('I dati della bozza non sono validi.');
        this.name = 'DraftPayloadValidationError';
        this.cause = cause;
    }
}

export class DraftCorruptedError extends Error {
    constructor(cause?: unknown) {
        super('La bozza salvata è danneggiata o incompatibile.');
        this.name = 'DraftCorruptedError';
        this.cause = cause;
    }
}

export class DraftStorageError extends Error {
    constructor(cause?: unknown) {
        super('Impossibile accedere alle bozze nel database locale.');
        this.name = 'DraftStorageError';
        this.cause = cause;
    }
}

export class DraftStorageQuotaError extends Error {
    constructor(cause?: unknown) {
        super('Spazio locale esaurito: non è stato possibile salvare la bozza.');
        this.name = 'DraftStorageQuotaError';
        this.cause = cause;
    }
}

export class DraftMigrationError extends Error {
    constructor(cause?: unknown) {
        super('Non è stato possibile migrare le bozze salvate.');
        this.name = 'DraftMigrationError';
        this.cause = cause;
    }
}
