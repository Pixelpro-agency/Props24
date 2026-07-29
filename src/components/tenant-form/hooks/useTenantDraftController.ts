import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
    DraftCorruptedError,
    DraftMigrationError,
    DraftPayloadValidationError,
    DraftStorageError,
    DraftStorageQuotaError,
} from '../../../db/databaseErrors';
import type {
    DraftRecord,
    DraftRepository,
} from '../../../db/draftRepository.port';
import { useDraftRepository } from '../../../drafts/DraftRepositoryContext';
import {
    defaultTenantValues,
    normalizeTenantDraft,
    type TenantFormData,
} from '../schema';
import { tenantDraftDefinition } from '../tenantDraftDefinition';

export type TenantDraftPhase =
    | 'loading'
    | 'choice_required'
    | 'ready'
    | 'load_error';

const TENANT_DRAFT_KEY = {
    formType: 'tenant',
    mode: 'create',
    entityId: null,
} as const;

function cloneSnapshot(value: unknown): TenantFormData {
    return normalizeTenantDraft(structuredClone(value));
}

function loadErrorMessage(error: unknown): string {
    if (error instanceof DraftCorruptedError) {
        return 'La bozza salvata è danneggiata o incompatibile.';
    }
    if (error instanceof DraftMigrationError) {
        return 'Non è stato possibile migrare la bozza salvata.';
    }
    if (error instanceof DraftStorageError) {
        return 'Impossibile accedere alla bozza nel database locale.';
    }
    return 'Impossibile caricare la bozza del nuovo inquilino.';
}

function saveErrorMessage(error: unknown): string {
    if (error instanceof DraftStorageQuotaError) {
        return 'Spazio locale esaurito: rimuovi allegati non necessari e riprova.';
    }
    if (error instanceof DraftPayloadValidationError) {
        return 'I dati della bozza non sono validi. Controlla i campi compilati.';
    }
    if (error instanceof DraftStorageError) {
        return 'Impossibile salvare la bozza nel database locale.';
    }
    return error instanceof Error && error.message
        ? error.message
        : 'Impossibile salvare la bozza.';
}

export interface TenantDraftController {
    phase: TenantDraftPhase;
    isSavingDraft: boolean;
    isDeletingDraft: boolean;
    loadError: string | null;
    operationError: string | null;
    draftError: string | null;
    draftSuccess: string | null;
    resumeDraft(): void;
    deleteAndRestart(): Promise<void>;
    retryLoad(): void;
    saveDraft(): Promise<void>;
    discardChanges(): void;
    clearDraftFeedback(): void;
}

export function useTenantDraftController(
    methods: UseFormReturn<TenantFormData>,
    repositoryOverride?: DraftRepository,
): TenantDraftController {
    const contextRepository = useDraftRepository();
    const repository = repositoryOverride ?? contextRepository;
    const [phase, setPhase] = useState<TenantDraftPhase>('loading');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isDeletingDraft, setIsDeletingDraft] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [operationError, setOperationError] = useState<string | null>(null);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [draftSuccess, setDraftSuccess] = useState<string | null>(null);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const loadedDraftRef = useRef<DraftRecord<TenantFormData> | null>(null);
    const lastSavedSnapshotRef = useRef<TenantFormData>(
        cloneSnapshot(defaultTenantValues),
    );
    const loadRef = useRef<{
        repository: DraftRepository;
        attempt: number;
        promise: Promise<DraftRecord<TenantFormData> | null>;
    } | null>(null);
    const requestIdRef = useRef(0);
    const savePendingRef = useRef(false);
    const deletePendingRef = useRef(false);

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        let active = true;
        setPhase('loading');
        setLoadError(null);
        setOperationError(null);

        if (
            loadRef.current?.repository !== repository
            || loadRef.current.attempt !== loadAttempt
        ) {
            loadRef.current = {
                repository,
                attempt: loadAttempt,
                promise: repository.get(
                    tenantDraftDefinition,
                    { mode: 'create' },
                ),
            };
        }

        void loadRef.current.promise.then((record) => {
            if (!active || requestId !== requestIdRef.current) return;
            loadedDraftRef.current = record;
            if (record) {
                setPhase('choice_required');
                return;
            }
            const empty = cloneSnapshot(defaultTenantValues);
            lastSavedSnapshotRef.current = cloneSnapshot(empty);
            methods.reset(empty);
            setPhase('ready');
        }).catch((error: unknown) => {
            if (!active || requestId !== requestIdRef.current) return;
            loadedDraftRef.current = null;
            setLoadError(loadErrorMessage(error));
            setPhase('load_error');
        });

        return () => {
            active = false;
        };
    }, [loadAttempt, methods, repository]);

    const resumeDraft = useCallback(() => {
        if (phase !== 'choice_required' || !loadedDraftRef.current) return;
        const snapshot = cloneSnapshot(loadedDraftRef.current.payload);
        lastSavedSnapshotRef.current = cloneSnapshot(snapshot);
        methods.reset(snapshot);
        setOperationError(null);
        setPhase('ready');
    }, [methods, phase]);

    const deleteAndRestart = useCallback(async () => {
        if (
            phase !== 'choice_required'
            || deletePendingRef.current
            || savePendingRef.current
        ) return;
        deletePendingRef.current = true;
        setIsDeletingDraft(true);
        setOperationError(null);
        try {
            await repository.delete(TENANT_DRAFT_KEY);
            const empty = cloneSnapshot(defaultTenantValues);
            loadedDraftRef.current = null;
            lastSavedSnapshotRef.current = cloneSnapshot(empty);
            methods.reset(empty);
            setPhase('ready');
        } catch {
            setOperationError(
                'Impossibile eliminare la bozza. Riprova.',
            );
        } finally {
            deletePendingRef.current = false;
            setIsDeletingDraft(false);
        }
    }, [methods, phase, repository]);

    const retryLoad = useCallback(() => {
        if (phase !== 'load_error') return;
        setLoadAttempt((current) => current + 1);
    }, [phase]);

    const saveDraft = useCallback(async () => {
        if (
            phase !== 'ready'
            || savePendingRef.current
            || deletePendingRef.current
        ) return;
        savePendingRef.current = true;
        setIsSavingDraft(true);
        setDraftError(null);
        setDraftSuccess(null);
        try {
            let payload: TenantFormData;
            try {
                payload = tenantDraftDefinition.parse(
                    methods.getValues(),
                    tenantDraftDefinition.schemaVersion,
                );
            } catch (error) {
                throw new DraftPayloadValidationError(error);
            }
            const saved = await repository.save(tenantDraftDefinition, {
                mode: 'create',
                payload,
            });
            const snapshot = cloneSnapshot(saved.payload);
            lastSavedSnapshotRef.current = cloneSnapshot(snapshot);
            methods.reset(snapshot);
            setDraftSuccess('Bozza salvata.');
        } catch (error) {
            setDraftError(saveErrorMessage(error));
        } finally {
            savePendingRef.current = false;
            setIsSavingDraft(false);
        }
    }, [methods, phase, repository]);

    const discardChanges = useCallback(() => {
        methods.reset(cloneSnapshot(lastSavedSnapshotRef.current));
    }, [methods]);

    const clearDraftFeedback = useCallback(() => {
        setDraftError(null);
        setDraftSuccess(null);
    }, []);

    return {
        phase,
        isSavingDraft,
        isDeletingDraft,
        loadError,
        operationError,
        draftError,
        draftSuccess,
        resumeDraft,
        deleteAndRestart,
        retryLoad,
        saveDraft,
        discardChanges,
        clearDraftFeedback,
    };
}
