import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
    DraftCorruptedError,
    DraftMigrationError,
    DraftPayloadValidationError,
    DraftStorageError,
    DraftStorageQuotaError,
} from '../../../db/databaseErrors';
import type { DraftRecord, DraftRepository } from '../../../db/draftRepository.port';
import { useDraftRepository } from '../../../drafts/DraftRepositoryContext';
import {
    defaultLeaseValues,
    normalizeLeaseFormData,
    type LeaseFormData,
} from '../schema/leaseFormSchema';
import {
    leaseDraftDefinition,
    type LeaseDraftPayload,
    type LeaseFormTab,
} from './leaseDraftDefinition';

export type LeaseDraftPhase = 'loading' | 'choice_required' | 'ready' | 'load_error';

const LEASE_DRAFT_KEY = {
    formType: 'lease',
    mode: 'create',
    entityId: null,
} as const;

function cloneForm(value: unknown): LeaseFormData {
    return normalizeLeaseFormData(structuredClone(value));
}

function clonePayload(value: LeaseDraftPayload): LeaseDraftPayload {
    return leaseDraftDefinition.parse(structuredClone(value), 1);
}

function loadErrorMessage(error: unknown): string {
    if (error instanceof DraftCorruptedError) return 'La bozza salvata della nuova locazione è danneggiata o incompatibile.';
    if (error instanceof DraftMigrationError) return 'Non è stato possibile migrare la bozza della nuova locazione.';
    if (error instanceof DraftStorageError) return 'Impossibile accedere alla bozza della nuova locazione nel database locale.';
    return 'Impossibile caricare la bozza della nuova locazione.';
}

function saveErrorMessage(error: unknown): string {
    if (error instanceof DraftStorageQuotaError) return 'Spazio locale esaurito: riduci i dati della bozza e riprova.';
    if (error instanceof DraftPayloadValidationError) return 'I dati della bozza della nuova locazione non sono validi.';
    if (error instanceof DraftStorageError) return 'Impossibile salvare la bozza della nuova locazione nel database locale.';
    return 'Impossibile salvare la bozza della nuova locazione.';
}

export interface LeaseDraftController {
    phase: LeaseDraftPhase;
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

export function useLeaseDraftController(
    methods: UseFormReturn<LeaseFormData>,
    activeTab: LeaseFormTab,
    setActiveTab: (tab: LeaseFormTab) => void,
    repositoryOverride?: DraftRepository,
): LeaseDraftController {
    const contextRepository = useDraftRepository();
    const repository = repositoryOverride ?? contextRepository;
    const [phase, setPhase] = useState<LeaseDraftPhase>('loading');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isDeletingDraft, setIsDeletingDraft] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [operationError, setOperationError] = useState<string | null>(null);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [draftSuccess, setDraftSuccess] = useState<string | null>(null);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const loadedDraftRef = useRef<DraftRecord<LeaseDraftPayload> | null>(null);
    const baselineRef = useRef<LeaseFormData>(cloneForm(defaultLeaseValues));
    const loadRef = useRef<{
        repository: DraftRepository;
        attempt: number;
        promise: Promise<DraftRecord<LeaseDraftPayload> | null>;
    } | null>(null);
    const requestIdRef = useRef(0);
    const savePendingRef = useRef(false);
    const deletePendingRef = useRef(false);
    const persistedDeletePromiseRef = useRef<Promise<void> | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        let active = true;
        setPhase('loading');
        setLoadError(null);
        setOperationError(null);
        if (loadRef.current?.repository !== repository || loadRef.current.attempt !== loadAttempt) {
            loadRef.current = {
                repository,
                attempt: loadAttempt,
                promise: repository.get(leaseDraftDefinition, { mode: 'create' }),
            };
        }
        void loadRef.current.promise.then((record) => {
            if (!active || !mountedRef.current || requestId !== requestIdRef.current) return;
            loadedDraftRef.current = record;
            if (record) {
                setPhase('choice_required');
                return;
            }
            const empty = cloneForm(defaultLeaseValues);
            baselineRef.current = cloneForm(empty);
            methods.reset(empty);
            setActiveTab('general');
            setPhase('ready');
        }).catch((error: unknown) => {
            if (!active || !mountedRef.current || requestId !== requestIdRef.current) return;
            loadedDraftRef.current = null;
            setLoadError(loadErrorMessage(error));
            setPhase('load_error');
        });
        return () => { active = false; };
    }, [loadAttempt, methods, repository, setActiveTab]);

    const resumeDraft = useCallback(() => {
        if (phase !== 'choice_required' || !loadedDraftRef.current) return;
        const payload = clonePayload(loadedDraftRef.current.payload);
        baselineRef.current = cloneForm(payload.formData);
        methods.reset(cloneForm(payload.formData));
        setActiveTab(payload.activeTab);
        setOperationError(null);
        setPhase('ready');
    }, [methods, phase, setActiveTab]);

    const deleteAndRestart = useCallback(async () => {
        if (phase !== 'choice_required' || deletePendingRef.current || savePendingRef.current) return;
        deletePendingRef.current = true;
        setIsDeletingDraft(true);
        setOperationError(null);
        try {
            await repository.delete(LEASE_DRAFT_KEY);
            if (!mountedRef.current) return;
            const empty = cloneForm(defaultLeaseValues);
            loadedDraftRef.current = null;
            baselineRef.current = cloneForm(empty);
            methods.reset(empty);
            setActiveTab('general');
            setPhase('ready');
        } catch {
            if (mountedRef.current) setOperationError('Impossibile eliminare la bozza della nuova locazione. Riprova.');
        } finally {
            deletePendingRef.current = false;
            if (mountedRef.current) setIsDeletingDraft(false);
        }
    }, [methods, phase, repository, setActiveTab]);

    const retryLoad = useCallback(() => {
        if (phase === 'load_error') setLoadAttempt((current) => current + 1);
    }, [phase]);

    const saveDraft = useCallback(async () => {
        if (phase !== 'ready' || savePendingRef.current || deletePendingRef.current) return;
        savePendingRef.current = true;
        setIsSavingDraft(true);
        setDraftError(null);
        setDraftSuccess(null);
        try {
            let payload: LeaseDraftPayload;
            try {
                payload = leaseDraftDefinition.parse({
                    formData: methods.getValues(),
                    activeTab,
                }, leaseDraftDefinition.schemaVersion);
            } catch (error) {
                throw new DraftPayloadValidationError(error);
            }
            const saved = await repository.save(leaseDraftDefinition, {
                mode: 'create',
                payload,
            });
            if (!mountedRef.current) return;
            const returned = clonePayload(saved.payload);
            baselineRef.current = cloneForm(returned.formData);
            methods.reset(cloneForm(returned.formData));
            setActiveTab(returned.activeTab);
            setDraftSuccess('Bozza salvata.');
        } catch (error) {
            const message = saveErrorMessage(error);
            if (mountedRef.current) setDraftError(message);
            throw new Error(message);
        } finally {
            savePendingRef.current = false;
            if (mountedRef.current) setIsSavingDraft(false);
        }
    }, [activeTab, methods, phase, repository, setActiveTab]);

    const deletePersistedDraft = useCallback((): Promise<void> => {
        if (persistedDeletePromiseRef.current) return persistedDeletePromiseRef.current;
        const operation = repository.delete(LEASE_DRAFT_KEY).then(() => undefined).finally(() => {
            persistedDeletePromiseRef.current = null;
        });
        persistedDeletePromiseRef.current = operation;
        return operation;
    }, [repository]);

    const discardChanges = useCallback(() => {
        methods.reset(cloneForm(baselineRef.current));
    }, [methods]);

    const clearDraftFeedback = useCallback(() => {
        setDraftError(null);
        setDraftSuccess(null);
    }, []);

    return {
        phase, isSavingDraft, isDeletingDraft, loadError, operationError,
        draftError, draftSuccess, resumeDraft, deleteAndRestart, retryLoad,
        saveDraft, deletePersistedDraft, discardChanges, clearDraftFeedback,
    };
}
