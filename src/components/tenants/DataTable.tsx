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
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TenantListItem } from '../../data/mockTenantList';
import { TENANT_STATUS_CONFIG } from '../../data/mockTenantList';

interface DataTableProps {
    data: TenantListItem[];
    pageSize?: number;
    columnVisibility: VisibilityState;
    onColumnVisibilityChange: (vis: VisibilityState) => void;
    rowSelection: RowSelectionState;
    onRowSelectionChange: (sel: RowSelectionState) => void;
}

const columnHelper = createColumnHelper<TenantListItem>();

function formatBalance(val: number): string {
    if (val === 0) return '€ 0,00';
    const formatted = Math.abs(val).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `- € ${formatted}` : `€ ${formatted}`;
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
            // Inquilino (Avatar + Name + subtitle)
            columnHelper.accessor('displayName', {
                id: 'displayName',
                header: 'Inquilino',
                cell: (info) => {
                    const row = info.row.original;
                    const initials = row.type === 'company'
                        ? row.displayName.charAt(0).toUpperCase()
                        : row.displayName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
                    return (
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: row.avatarColor }}
                            >
                                {initials}
                            </div>
                            <div>
                                <Link to={`/tenants/${row.id}`} className="font-medium text-gray-800 hover:text-green-600 transition-colors cursor-pointer block">
                                    {info.getValue() as string}
                                </Link>
                                <div className="text-xs text-gray-500">{row.subtitle}</div>
                            </div>
                        </div>
                    );
                },
                size: 280,
            }),
            // Tipo
            columnHelper.accessor('type', {
                id: 'type',
                header: 'Tipo',
                cell: (info) => (
                    <span className="text-sm text-gray-600">
                        {info.getValue() === 'person' ? 'Persona' : 'Società'}
                    </span>
                ),
                size: 100,
            }),
            // Proprietà
            columnHelper.accessor('propertyName', {
                id: 'propertyName',
                header: 'Proprietà',
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className={`text-sm ${val ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                            {val ?? 'Nessuna'}
                        </span>
                    );
                },
                size: 180,
            }),
            // Telefono
            columnHelper.accessor('mobilePhone', {
                id: 'mobilePhone',
                header: 'Telefono',
                cell: (info) => {
                    const val = info.getValue();
                    return <span className="text-sm text-gray-600">{val ?? '—'}</span>;
                },
                size: 140,
            }),
            // Email
            columnHelper.accessor('email', {
                id: 'email',
                header: 'Email',
                cell: (info) => {
                    const val = info.getValue();
                    return val ? (
                        <a href={`mailto:${val}`} className="text-sm text-blue-600 hover:underline">
                            {val}
                        </a>
                    ) : (
                        <span className="text-sm text-gray-400">—</span>
                    );
                },
                size: 180,
            }),
            // Saldo
            columnHelper.accessor('balance', {
                id: 'balance',
                header: 'Saldo',
                cell: (info) => {
                    const val = info.getValue();
                    const color = val < 0 ? 'text-red-600' : val > 0 ? 'text-green-600' : 'text-gray-600';
                    return <span className={`text-sm font-medium ${color}`}>{formatBalance(val)}</span>;
                },
                size: 120,
            }),
            // Stato
            columnHelper.accessor('status', {
                id: 'status',
                header: 'Stato',
                cell: (info) => {
                    const cfg = TENANT_STATUS_CONFIG[info.getValue()];
                    return (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.textColor}`}
                        >
                            {cfg.label}
                        </span>
                    );
                },
                size: 100,
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
            <table className="w-full" role="grid">
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
                        {table.getRowModel().rows.length} di {data.length} inquilini
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
