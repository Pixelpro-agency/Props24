import { clearDraft as clearDatabaseDraft } from '../../../db/jsonDb';

export function useFormPersistence() {
    const clearDraft = () => {
        clearDatabaseDraft('propertyForm');
    };

    return { clearDraft };
}
