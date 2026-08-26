import {
    useCallback,
    useEffect,
    useMemo,
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
    defaultPropertyFormStateValues,
    normalizePropertyDraftState,
    type PropertyFormState,
} from '../schema';
import { propertyDraftDefinition } from '../propertyDraftDefinition';

export type PropertyDraftPhase =
    | 'loading'
    | 'choice_required'
    | 'ready'
    | 'load_error';

export type PropertyDraftTarget =
    | { mode: 'create' }
    | { mode: 'edit'; entityId: string };

export interface PropertyDraftContextOptions {
    initialState?: PropertyFormState;
    constrainSnapshot?: (snapshot: PropertyFormState) => PropertyFormState;
    target?: PropertyDraftTarget;
}

function cloneSnapshot(
    value: unknown,
    constrainSnapshot?: (snapshot: PropertyFormState) => PropertyFormState,
): PropertyFormState {
    const snapshot = normalizePropertyDraftState(structuredClone(value));
    return constrainSnapshot
        ? normalizePropertyDraftState(constrainSnapshot(snapshot))
        : snapshot;
}

function loadErrorMessage(
    error: unknown,
    targetMode: 'create' | 'edit',
): string {
    if (error instanceof DraftCorruptedError) {
        return 'La bozza salvata è danneggiata o incompatibile.';
    }
    if (error instanceof DraftMigrationError) {
        return 'Non è stato possibile migrare la bozza salvata.';
    }
    if (error instanceof DraftStorageError) {
        return 'Impossibile accedere alla bozza nel database locale.';
    }
    return targetMode === 'edit'
        ? 'Impossibile caricare la bozza di modifica dell’unità.'
        : 'Impossibile caricare la bozza della nuova unità.';
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
    return 'Impossibile salvare la bozza.';
}

export interface PropertyDraftController {
    phase: PropertyDraftPhase;
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
    deletePersistedDraft(): Promise<void>;
    discardChanges(): void;
    clearDraftFeedback(): void;
}

export function usePropertyDraftController(
    methods: UseFormReturn<PropertyFormState>,
    repositoryOverride?: DraftRepository,
    options: PropertyDraftContextOptions = {},
): PropertyDraftController {
    const contextRepository = useDraftRepository();
    const repository = repositoryOverride ?? contextRepository;
    const [phase, setPhase] = useState<PropertyDraftPhase>('loading');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isDeletingDraft, setIsDeletingDraft] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [operationError, setOperationError] = useState<string | null>(null);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [draftSuccess, setDraftSuccess] = useState<string | null>(null);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const loadedDraftRef = useRef<DraftRecord<PropertyFormState> | null>(null);
    const initialState = options.initialState ?? defaultPropertyFormStateValues;
    const constrainSnapshot = options.constrainSnapshot;
    const targetMode = options.target?.mode ?? 'create';
    const targetEntityId = options.target?.mode === 'edit'
        ? options.target.entityId
        : null;
    const draftKey = useMemo(() => ({
        formType: 'property',
        mode: targetMode,
        entityId: targetEntityId,
    } as const), [targetEntityId, targetMode]);
    const draftLookup = useMemo(() => targetMode === 'edit'
        ? { mode: 'edit' as const, entityId: targetEntityId as string }
        : { mode: 'create' as const }, [targetEntityId, targetMode]);
    const lastSavedSnapshotRef = useRef<PropertyFormState>(
        cloneSnapshot(initialState, constrainSnapshot),
    );
    const loadRef = useRef<{
        repository: DraftRepository;
        attempt: number;
        mode: 'create' | 'edit';
        entityId: string | null;
        promise: Promise<DraftRecord<PropertyFormState> | null>;
    } | null>(null);
    const requestIdRef = useRef(0);
    const savePendingRef = useRef(false);
    const deletePendingRef = useRef(false);
    const persistedDeletePromiseRef = useRef<Promise<void> | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        let active = true;
        setPhase('loading');
        setLoadError(null);
        setOperationError(null);

        if (
            loadRef.current?.repository !== repository
            || loadRef.current.attempt !== loadAttempt
            || loadRef.current.mode !== targetMode
            || loadRef.current.entityId !== targetEntityId
        ) {
            loadRef.current = {
                repository,
                attempt: loadAttempt,
                mode: targetMode,
                entityId: targetEntityId,
                promise: repository.get(
                    propertyDraftDefinition,
                    draftLookup,
                ),
            };
        }

        void loadRef.current.promise.then((record) => {
            if (
                !active
                || !mountedRef.current
                || requestId !== requestIdRef.current
            ) return;
            loadedDraftRef.current = record;
            if (record) {
                setPhase('choice_required');
                return;
            }
            const empty = cloneSnapshot(initialState, constrainSnapshot);
            lastSavedSnapshotRef.current = cloneSnapshot(empty, constrainSnapshot);
            methods.reset(empty);
            setPhase('ready');
        }).catch((error: unknown) => {
            if (
                !active
                || !mountedRef.current
                || requestId !== requestIdRef.current
            ) return;
            loadedDraftRef.current = null;
            setLoadError(loadErrorMessage(error, targetMode));
            setPhase('load_error');
        });

        return () => {
            active = false;
        };
    }, [
        constrainSnapshot,
        draftLookup,
        initialState,
        loadAttempt,
        methods,
        repository,
        targetEntityId,
        targetMode,
    ]);

    const resumeDraft = useCallback(() => {
        if (phase !== 'choice_required' || !loadedDraftRef.current) return;
        const snapshot = cloneSnapshot(loadedDraftRef.current.payload, constrainSnapshot);
        lastSavedSnapshotRef.current = cloneSnapshot(snapshot, constrainSnapshot);
        methods.reset(snapshot);
        setOperationError(null);
        setPhase('ready');
    }, [constrainSnapshot, methods, phase]);

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
            await repository.delete(draftKey);
            if (!mountedRef.current) return;
            const empty = cloneSnapshot(initialState, constrainSnapshot);
            loadedDraftRef.current = null;
            lastSavedSnapshotRef.current = cloneSnapshot(empty, constrainSnapshot);
            methods.reset(empty);
            setPhase('ready');
        } catch {
            if (mountedRef.current) {
                setOperationError(
                    'Impossibile eliminare la bozza. Riprova.',
                );
            }
        } finally {
            deletePendingRef.current = false;
            if (mountedRef.current) setIsDeletingDraft(false);
        }
    }, [constrainSnapshot, draftKey, initialState, methods, phase, repository]);

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
            let payload: PropertyFormState;
            try {
                payload = propertyDraftDefinition.parse(
                    cloneSnapshot(methods.getValues(), constrainSnapshot),
                    propertyDraftDefinition.schemaVersion,
                );
            } catch (error) {
                throw new DraftPayloadValidationError(error);
            }
            const saved = await repository.save(
                propertyDraftDefinition,
                targetMode === 'edit'
                    ? { mode: 'edit', entityId: targetEntityId as string, payload }
                    : { mode: 'create', payload },
            );
            if (!mountedRef.current) return;
            const snapshot = cloneSnapshot(saved.payload, constrainSnapshot);
            lastSavedSnapshotRef.current = cloneSnapshot(snapshot, constrainSnapshot);
            methods.reset(snapshot);
            setDraftSuccess('Bozza salvata.');
        } catch (error) {
            const message = saveErrorMessage(error);
            if (mountedRef.current) setDraftError(message);
            throw new Error(message);
        } finally {
            savePendingRef.current = false;
            if (mountedRef.current) setIsSavingDraft(false);
        }
    }, [constrainSnapshot, methods, phase, repository, targetEntityId, targetMode]);

    const deletePersistedDraft = useCallback((): Promise<void> => {
        if (persistedDeletePromiseRef.current) {
            return persistedDeletePromiseRef.current;
        }
        const operation = repository.delete(draftKey)
            .then(() => undefined)
            .finally(() => {
                persistedDeletePromiseRef.current = null;
            });
        persistedDeletePromiseRef.current = operation;
        return operation;
    }, [draftKey, repository]);

    const discardChanges = useCallback(() => {
        methods.reset(cloneSnapshot(lastSavedSnapshotRef.current, constrainSnapshot));
    }, [constrainSnapshot, methods]);

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
        deletePersistedDraft,
        discardChanges,
        clearDraftFeedback,
    };
}
