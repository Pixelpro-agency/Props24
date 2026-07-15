import { useState, useMemo, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Building } from '../../types/building';

interface BuildingsTableProps {
    data: Building[];
    pageSize?: number;
    rowSelection: RowSelectionState;
    onRowSelectionChange: (sel: RowSelectionState) => void;
}

const columnHelper = createColumnHelper<Building>();

export function BuildingsTable({
    data,
    pageSize = 100,
    rowSelection,
    onRowSelectionChange,
}: BuildingsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const columns = useMemo(
        () => [
            // Checkbox column
            columnHelper.display({
                id: 'select',
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
                    />
                ),
                size: 40,
                enableSorting: false,
            }),

            // Edificio (address)
            columnHelper.accessor('address', {
                id: 'BuildingAddress',
                header: 'Edificio',
                cell: (info) => (
                    <span className="font-medium text-gray-800">{info.getValue()}</span>
                ),
                size: 300,
            }),

            // Superficie
            columnHelper.accessor('size', {
                id: 'BuildingSize',
                header: 'Superficie',
                cell: (info) => {
                    const val = info.getValue();
                    return <span className="text-sm text-gray-600">{val ? `${val.toLocaleString('it-IT')} m²` : '—'}</span>;
                },
                size: 100,
                meta: { hiddenOnMobile: true },
            }),

            // Unità
            columnHelper.accessor('unitsCount', {
                id: 'BuildingPropertiesCount',
                header: 'Unità',
                cell: (info) => (
                    <span className="text-sm text-gray-600">{info.getValue()}</span>
                ),
                size: 300,
                meta: { hiddenOnMobile: true },
            }),

            // Descrizione
            columnHelper.accessor('description', {
                id: 'BuildingComments',
                header: 'Descrizione',
                cell: (info) => (
                    <span className="text-sm text-gray-500 line-clamp-2">{info.getValue()}</span>
                ),
                size: 300,
                meta: { hiddenOnMobile: true },
            }),

            // Azioni
            columnHelper.display({
                id: 'actions',
                header: 'Azioni',
                cell: () => (
                    <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        title="Altre azioni"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                ),
                size: 60,
                enableSorting: false,
            }),
        ],
        [],
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            rowSelection,
        },
        onSortingChange: setSorting,
        onRowSelectionChange: (updater) => {
            const newSel = typeof updater === 'function' ? updater(rowSelection) : updater;
            onRowSelectionChange(newSel);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        enableRowSelection: true,
        initialState: {
            pagination: { pageSize },
        },
    });

    // Sync pageSize changes from parent
    useEffect(() => {
        table.setPageSize(pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                {/* Header */}
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b border-gray-200">
                            {headerGroup.headers.map((header) => {
                                const canSort = header.column.getCanSort();
                                const sorted = header.column.getIsSorted();
                                const isHiddenOnMobile = (header.column.columnDef.meta as { hiddenOnMobile?: boolean })?.hiddenOnMobile;

                                return (
                                    <th
                                        key={header.id}
                                        className={`
                                            px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
                                            ${canSort ? 'cursor-pointer select-none hover:text-gray-700' : ''}
                                            ${isHiddenOnMobile ? 'hidden md:table-cell' : ''}
                                        `}
                                        style={{ width: header.getSize() }}
                                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {canSort && (
                                                <span className="text-gray-400">
                                                    {sorted === 'asc' ? (
                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                    ) : sorted === 'desc' ? (
                                                        <ArrowDown className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>

                {/* Body */}
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.id}
                            className={`
                                border-b border-gray-100 transition-all duration-150
                                ${row.getIsSelected()
                                    ? 'bg-green-50 ring-inset ring-1 ring-green-200'
                                    : 'hover:bg-gray-50'}
                            `}
                        >
                            {row.getVisibleCells().map((cell) => {
                                const isHiddenOnMobile = (cell.column.columnDef.meta as { hiddenOnMobile?: boolean })?.hiddenOnMobile;
                                return (
                                    <td
                                        key={cell.id}
                                        className={`px-4 py-3 ${isHiddenOnMobile ? 'hidden md:table-cell' : ''}`}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination controls */}
            {data.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                    <span>
                        {table.getRowModel().rows.length} di {data.length} edifici
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Prec.
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                        </span>
                        <button
                            type="button"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Succ.
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
