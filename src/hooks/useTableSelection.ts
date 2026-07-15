import { useState, useCallback, useMemo } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';

export function useTableSelection() {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const selectedCount = useMemo(
        () => Object.keys(rowSelection).filter((k) => rowSelection[k]).length,
        [rowSelection],
    );

    const selectedIds = useMemo(
        () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
        [rowSelection],
    );

    const clearSelection = useCallback(() => {
        setRowSelection({});
    }, []);

    const isAnySelected = selectedCount > 0;

    return {
        rowSelection,
        setRowSelection,
        selectedCount,
        selectedIds,
        clearSelection,
        isAnySelected,
    };
}
