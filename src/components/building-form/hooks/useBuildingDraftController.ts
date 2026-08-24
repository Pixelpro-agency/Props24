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
import { buildingDraftDefinition } from '../buildingDraftDefinition';
import { defaultBuildingValues, normalizeBuildingDraftData, type BuildingFormData } from '../schema';

export type BuildingDraftPhase = 'loading' | 'choice_required' | 'ready' | 'load_error';
const BUILDING_DRAFT_KEY = { formType: 'building', mode: 'create', entityId: null } as const;

function snapshot(value: unknown): BuildingFormData {
    return normalizeBuildingDraftData(structuredClone(value));
}
function loadMessage(error: unknown) {
    if (error instanceof DraftCorruptedError) return 'La bozza salvata è danneggiata o incompatibile.';
    if (error instanceof DraftMigrationError) return 'Non è stato possibile migrare la bozza salvata.';
    if (error instanceof DraftStorageError) return 'Impossibile accedere alla bozza nel database locale.';
    return 'Impossibile caricare la bozza del nuovo edificio.';
}
function saveMessage(error: unknown) {
    if (error instanceof DraftStorageQuotaError) return 'Spazio locale esaurito. Riprova dopo aver liberato spazio.';
    if (error instanceof DraftPayloadValidationError) return 'I dati della bozza non sono validi.';
    if (error instanceof DraftStorageError) return 'Impossibile salvare la bozza nel database locale.';
    return 'Impossibile salvare la bozza.';
}

export function useBuildingDraftController(methods: UseFormReturn<BuildingFormData>, override?: DraftRepository) {
    const contextRepository = useDraftRepository();
    const repository = override ?? contextRepository;
    const [phase, setPhase] = useState<BuildingDraftPhase>('loading');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isDeletingDraft, setIsDeletingDraft] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [operationError, setOperationError] = useState<string | null>(null);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [draftSuccess, setDraftSuccess] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const loadedRef = useRef<DraftRecord<BuildingFormData> | null>(null);
    const baselineRef = useRef(snapshot(defaultBuildingValues));
    const loadRef = useRef<{ repository: DraftRepository; attempt: number; promise: Promise<DraftRecord<BuildingFormData> | null> } | null>(null);
    const requestRef = useRef(0);
    const savePending = useRef(false);
    const deletePending = useRef(false);
    const cleanupPromise = useRef<Promise<void> | null>(null);

    useEffect(() => {
        const request = ++requestRef.current;
        let active = true;
        setPhase('loading');
        setLoadError(null);
        setOperationError(null);
        if (loadRef.current?.repository !== repository || loadRef.current.attempt !== attempt) {
            loadRef.current = { repository, attempt, promise: repository.get(buildingDraftDefinition, { mode: 'create' }) };
        }
        void loadRef.current.promise.then((record) => {
            if (!active || request !== requestRef.current) return;
            loadedRef.current = record;
            if (record) { setPhase('choice_required'); return; }
            const empty = snapshot(defaultBuildingValues);
            baselineRef.current = snapshot(empty);
            methods.reset(empty);
            setPhase('ready');
        }).catch((error: unknown) => {
            if (!active || request !== requestRef.current) return;
            loadedRef.current = null;
            setLoadError(loadMessage(error));
            setPhase('load_error');
        });
        return () => { active = false; };
    }, [attempt, methods, repository]);

    const resumeDraft = useCallback(() => {
        if (phase !== 'choice_required' || !loadedRef.current) return;
        const next = snapshot(loadedRef.current.payload);
        baselineRef.current = snapshot(next);
        methods.reset(next);
        setOperationError(null);
        setPhase('ready');
    }, [methods, phase]);

    const deleteAndRestart = useCallback(async () => {
        if (phase !== 'choice_required' || deletePending.current || savePending.current) return;
        deletePending.current = true; setIsDeletingDraft(true); setOperationError(null);
        try {
            await repository.delete(BUILDING_DRAFT_KEY);
            const empty = snapshot(defaultBuildingValues);
            loadedRef.current = null; baselineRef.current = snapshot(empty);
            methods.reset(empty); setPhase('ready');
        } catch { setOperationError('Impossibile eliminare la bozza. Riprova.'); }
        finally { deletePending.current = false; setIsDeletingDraft(false); }
    }, [methods, phase, repository]);

    const retryLoad = useCallback(() => { if (phase === 'load_error') setAttempt((value) => value + 1); }, [phase]);
    const saveDraft = useCallback(async () => {
        if (phase !== 'ready' || savePending.current || deletePending.current) return;
        savePending.current = true; setIsSavingDraft(true); setDraftError(null); setDraftSuccess(null);
        try {
            let payload: BuildingFormData;
            try { payload = buildingDraftDefinition.parse(methods.getValues(), buildingDraftDefinition.schemaVersion); }
            catch (error) { throw new DraftPayloadValidationError(error); }
            const saved = await repository.save(buildingDraftDefinition, { mode: 'create', payload });
            const next = snapshot(saved.payload);
            baselineRef.current = snapshot(next); methods.reset(next); setDraftSuccess('Bozza salvata.');
        } catch (error) {
            const message = saveMessage(error); setDraftError(message); throw new Error(message);
        } finally { savePending.current = false; setIsSavingDraft(false); }
    }, [methods, phase, repository]);
    const deletePersistedDraft = useCallback(() => {
        if (cleanupPromise.current) return cleanupPromise.current;
        const operation = repository.delete(BUILDING_DRAFT_KEY).then(() => undefined).finally(() => { cleanupPromise.current = null; });
        cleanupPromise.current = operation;
        return operation;
    }, [repository]);
    const discardChanges = useCallback(() => { methods.reset(snapshot(baselineRef.current)); }, [methods]);
    const clearDraftFeedback = useCallback(() => { setDraftError(null); setDraftSuccess(null); }, []);

    return { phase, isSavingDraft, isDeletingDraft, loadError, operationError, draftError, draftSuccess, resumeDraft, deleteAndRestart, retryLoad, saveDraft, deletePersistedDraft, discardChanges, clearDraftFeedback };
}
