import { useMemo } from 'react';
import type { BuildingRecord } from '../../db/database.types';
import { createBuildingRepository } from '../../db/buildingRepository';
import { BuildingForm } from './BuildingForm';
import {
    toBuildingFormData,
    toBuildingUpdateInput,
    type BuildingFormData,
} from './schema';

export interface BuildingEditFormProps {
    accountId: string;
    building: BuildingRecord;
    onUpdated(building: BuildingRecord): void;
    onCancel(): void;
}

export function BuildingEditForm({
    accountId,
    building,
    onUpdated,
    onCancel,
}: BuildingEditFormProps) {
    const repository = useMemo(
        () => createBuildingRepository({ accountId }),
        [accountId],
    );
    const initialValues = useMemo(
        () => toBuildingFormData(building),
        [building],
    );

    const handleSubmit = (data: BuildingFormData) => {
        const updated = repository.update(
            building.id,
            toBuildingUpdateInput(data),
        );
        onUpdated(updated);
    };

    return (
        <BuildingForm
            mode="edit"
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={onCancel}
        />
    );
}
