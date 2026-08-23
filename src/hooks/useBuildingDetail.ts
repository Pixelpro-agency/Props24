import { useEffect, useMemo, useState } from 'react';
import { createJsonDbAccountScope } from '../db/jsonDb';
import type { BuildingRecord, PropertyRecord } from '../db/database.types';

interface BuildingDetailSnapshot {
    accountId: string;
    buildingId: string;
    building: BuildingRecord | null;
    units: PropertyRecord[];
}

export interface BuildingDetailState {
    loading: boolean;
    building: BuildingRecord | null;
    units: PropertyRecord[];
}

export function useBuildingDetail(
    accountId: string | null,
    buildingId: string | null,
): BuildingDetailState {
    const [snapshot, setSnapshot] = useState<BuildingDetailSnapshot | null>(null);
    const scope = useMemo(
        () => accountId === null ? null : createJsonDbAccountScope(accountId),
        [accountId],
    );

    useEffect(() => {
        if (scope === null || accountId === null || buildingId === null) return;

        let active = true;
        const refresh = () => {
            const database = scope.getDatabase();
            if (!active) return;
            setSnapshot({
                accountId,
                buildingId,
                building: database.buildings.find((item) => item.id === buildingId) ?? null,
                units: database.properties.filter(
                    (property) => property.relations.buildingId === buildingId,
                ),
            });
        };

        refresh();
        const unsubscribe = scope.subscribe(refresh);
        return () => {
            active = false;
            unsubscribe();
        };
    }, [accountId, buildingId, scope]);

    const isCurrent = snapshot?.accountId === accountId
        && snapshot?.buildingId === buildingId;

    return {
        loading: accountId !== null && buildingId !== null && !isCurrent,
        building: isCurrent ? snapshot.building : null,
        units: isCurrent ? snapshot.units : [],
    };
}
