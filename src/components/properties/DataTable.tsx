import { useState, useMemo, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type VisibilityState,
    type RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Property } from '../../types/property';
import { STATUS_CONFIG } from '../../types/property';
import { propertyTypes } from '../../data/propertyTypes';

interface DataTableProps {
    data: Property[];
    pageSize?: number;
    columnVisibility: VisibilityState;
    onColumnVisibilityChange: (vis: VisibilityState) => void;
    rowSelection: RowSelectionState;
    onRowSelectionChange: (sel: RowSelectionState) => void;
}

const columnHelper = createColumnHelper<Property>();

function getTypeLabel(type: string): string {
    return propertyTypes.find((pt) => pt.value === type)?.label ?? type;
}

export function DataTable({
    data,
    pageSize = 100,
    columnVisibility,
    onColumnVisibilityChange,
    rowSelection,
    onRowSelectionChange,
}: DataTableProps) {
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
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
                    />
                ),
                size: 40,
                enableSorting: false,
            }),
            // Unità
            columnHelper.accessor('title', {
                header: 'Unità',
                cell: (info) => (
                    <div>
                        <Link
                            to={`/properties/units/${info.row.original.id}`}
                            className="font-medium text-gray-800 hover:text-green-600 transition-colors"
                        >
                            {info.getValue()}
                        </Link>
                        <div className="text-xs text-gray-500">{info.row.original.address}</div>
                    </div>
                ),
                size: 280,
            }),
            // Tipo
            columnHelper.accessor('type', {
                id: 'type',
                header: 'Tipo',
                cell: (info) => (
                    <span className="text-sm text-gray-600">{getTypeLabel(info.getValue())}</span>
                ),
                size: 120,
            }),
            // Superficie
            columnHelper.accessor('surface', {
                id: 'surface',
                header: 'Superficie',
                cell: (info) => {
                    const val = info.getValue();
                    return <span className="text-sm text-gray-600">{val ? `${val} m²` : '—'}</span>;
                },
                size: 100,
            }),
            // Vani
            columnHelper.accessor('rooms', {
                id: 'rooms',
                header: 'Vani',
                cell: (info) => {
                    const val = info.getValue();
                    return <span className="text-sm text-gray-600">{val ?? '—'}</span>;
                },
                size: 80,
            }),
            // Inquilino
            columnHelper.accessor('tenant', {
                id: 'tenant',
                header: 'Inquilino',
                cell: (info) => {
                    const val = info.getValue();
                    if (!val) {
                        return <span className="text-sm text-gray-400 italic">Nessuno</span>;
                    }

                    return (
                        <span className="text-sm font-medium text-gray-800">
                            {val}
                        </span>
                    );
                },
                size: 160,
            }),
            // Affitto
            columnHelper.accessor('rent', {
                id: 'rent',
                header: 'Affitto',
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className="text-sm text-gray-600">
                            {val ? `€ ${val.toLocaleString('it-IT')}/mese` : '—'}
                        </span>
                    );
                },
                size: 130,
            }),
            // Stato
            columnHelper.accessor('status', {
                id: 'status',
                header: 'Stato',
                cell: (info) => {
                    const cfg = STATUS_CONFIG[info.getValue()];
                    return (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.textColor}`}
                        >
                            {cfg.label}
                        </span>
                    );
                },
                size: 140,
            }),
            // Visibilità
            columnHelper.accessor('visibility', {
                id: 'visibility',
                header: 'Visibilità',
                cell: (info) => {
                    const isPublished = info.getValue() === 'pubblicato';
                    return (
                        <span className={`inline-flex items-center gap-1 text-sm ${isPublished ? 'text-green-600' : 'text-gray-400'}`}>
                            {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {isPublished ? 'Pubblicato' : 'Nascosto'}
                        </span>
                    );
                },
                size: 120,
            }),
        ],
        [],
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: (updater) => {
            const newVis = typeof updater === 'function' ? updater(columnVisibility) : updater;
            onColumnVisibilityChange(newVis);
        },
        onRowSelectionChange: (updater) => {
            const newSel = typeof updater === 'function' ? updater(rowSelection) : updater;
            onRowSelectionChange(newSel);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        enableRowSelection: true,
        getRowId: (row) => row.id,
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
                                return (
                                    <th
                                        key={header.id}
                                        className={`
                      px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
                      ${canSort ? 'cursor-pointer select-none hover:text-gray-700' : ''}
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
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-4 py-3">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination controls */}
            {data.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                    <span>
                        {table.getRowModel().rows.length} di {data.length} unità
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
