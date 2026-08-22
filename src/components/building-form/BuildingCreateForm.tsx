import { useMemo, useState } from 'react';
import type { BuildingRecord } from '../../db/database.types';
import { createBuildingRepository } from '../../db/buildingRepository';
import { BuildingForm } from './BuildingForm';
import { toBuildingCreateInput, type BuildingFormData } from './schema';

export interface BuildingCreateFormProps {
    accountId: string;
    onCreated?: (building: BuildingRecord) => void;
}

export function BuildingCreateForm({ accountId, onCreated }: BuildingCreateFormProps) {
    const repository = useMemo(() => createBuildingRepository({ accountId }), [accountId]);
    const [createdBuilding, setCreatedBuilding] = useState<BuildingRecord | null>(null);

    const handleSubmit = (data: BuildingFormData) => {
        setCreatedBuilding(null);
        const created = repository.create(toBuildingCreateInput(data));
        setCreatedBuilding(created);
        onCreated?.(created);
    };

    return (
        <div className="flex flex-col gap-4">
            <BuildingForm onSubmit={handleSubmit} />
            {createdBuilding && (
                <div role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    Edificio salvato correttamente.
                </div>
            )}
        </div>
    );
}
