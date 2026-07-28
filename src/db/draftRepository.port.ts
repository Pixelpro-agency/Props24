export const DRAFT_FORM_TYPES = [
    'building',
    'property',
    'tenant',
    'lease',
] as const;

export type DraftFormType = (typeof DRAFT_FORM_TYPES)[number];

export const DRAFT_MODES = ['create', 'edit'] as const;

export type DraftMode = (typeof DRAFT_MODES)[number];

export interface DraftKey {
    formType: DraftFormType;
    mode: DraftMode;
    entityId: string | null;
}

export interface DraftLookupKey {
    mode: DraftMode;
    entityId?: string | null;
}

export interface DraftRecord<TPayload = unknown> {
    id: string;
    accountId: string;
    formType: DraftFormType;
    mode: DraftMode;
    entityId: string | null;
    payload: TPayload;
    schemaVersion: number;
    createdAt: string;
    updatedAt: string;
}

export interface DraftDefinition<TPayload> {
    formType: DraftFormType;
    schemaVersion: number;
    parse(payload: unknown, schemaVersion: number): TPayload;
}

export interface SaveDraftInput<TPayload> {
    mode: DraftMode;
    entityId?: string | null;
    payload: TPayload;
}

export interface DraftFilter {
    formType?: DraftFormType;
    mode?: DraftMode;
    entityId?: string | null;
}

export interface DraftRepository {
    get<TPayload>(
        definition: DraftDefinition<TPayload>,
        key: DraftLookupKey,
    ): Promise<DraftRecord<TPayload> | null>;
    list(filter?: DraftFilter): Promise<DraftRecord<unknown>[]>;
    save<TPayload>(
        definition: DraftDefinition<TPayload>,
        input: SaveDraftInput<TPayload>,
    ): Promise<DraftRecord<TPayload>>;
    delete(key: DraftKey): Promise<boolean>;
}
