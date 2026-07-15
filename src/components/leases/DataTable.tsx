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
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, FileText, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LeaseListItem } from '../../landlord/leases/types/leaseListing.types';

interface DataTableProps {
    data: LeaseListItem[];
    pageSize: number;
    columnVisibility: VisibilityState;
    onColumnVisibilityChange: (updater: any) => void;
    rowSelection: RowSelectionState;
    onRowSelectionChange: (updater: any) => void;
    onDownloadClick?: (leaseId: string) => void;
}

const columnHelper = createColumnHelper<LeaseListItem>();

function formatCurrency(val: number): string {
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
    onDownloadClick,
}: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'startDate', desc: false }]);

    // We intentionally don't wrap columns in useMemo if we need onDownloadClick dynamically,
    // or we can just memoize with onDownloadClick in the deps array.
    // Given the simplicity, we can keep the columns calculation here since onDownloadClick doesn't change on every render.
    const columns = useMemo(
        () => [
            // 1. Checkbox column
            columnHelper.display({
                id: 'select',
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="w-4 h-4 rounded border-gray-300 text-[#72a333] focus:ring-[#72a333] cursor-pointer accent-[#72a333]"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-[#72a333] focus:ring-[#72a333] cursor-pointer accent-[#72a333]"
                    />
                ),
                size: 40,
                enableSorting: false,
            }),
            // 2. Proprietà (nome + indirizzo)
            columnHelper.accessor('propertyTitle', {
                id: 'propertyTitle',
                header: 'Proprietà',
                cell: (info) => {
                    const row = info.row.original;
                    return (
                        <div>
                            <Link
                                to={`/properties/${row.propertyId}`}
                                className="font-medium text-gray-800 hover:text-[#72a333] transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {row.propertyTitle}
                            </Link>
                            {row.propertyAddress && (
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {row.propertyAddress}
                                </div>
                            )}
                        </div>
                    );
                },
                size: 220,
            }),
            // 3. Tipo locazione
            columnHelper.accessor('leaseTypeLabel', {
                id: 'LeaseType',
                header: 'Tipo',
                cell: (info) => <span className="text-sm text-gray-600">{info.getValue()}</span>,
                size: 140,
            }),
            // 4. Inquilino
            columnHelper.accessor('tenantName', {
                id: 'LeaseTenant',
                header: 'Inquilino',
                cell: (info) => {
                    const row = info.row.original;
                    if (!row.tenantName) return <span className="text-sm text-gray-400 italic">Nessuno</span>;
                    return (
                        <Link
                            to={`/tenants/${row.tenantId || ''}`}
                            className="text-sm font-medium text-gray-800 hover:text-[#72a333] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {row.tenantName}
                        </Link>
                    );
                },
                size: 160,
            }),
            // 5. Affitto mensile
            columnHelper.accessor('monthlyAmount', {
                id: 'LeaseRent',
                header: 'Affitto',
                cell: (info) => <span className="text-sm font-medium text-gray-700">{formatCurrency(info.getValue())}</span>,
                size: 110,
            }),
            // 6. Spese accessorie
            columnHelper.accessor('maintenance', {
                id: 'LeaseExpenses',
                header: 'Spese',
                cell: (info) => <span className="text-sm text-gray-600">{formatCurrency(info.getValue() || 0)}</span>,
                size: 100,
            }),
            // 7. Deposito cauzionale
            columnHelper.accessor('securityDeposit', {
                id: 'LeaseDeposit',
                header: 'Deposito',
                cell: (info) => <span className="text-sm text-gray-600">{formatCurrency(info.getValue() || 0)}</span>,
                size: 100,
            }),
            // 8. Durata (Date)
            columnHelper.accessor('startDate', {
                id: 'LeaseDuration',
                header: 'Durata',
                cell: (info) => {
                    const row = info.row.original;
                    return (
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-700">{row.startDate}</span>
                            <span className="text-xs text-gray-400">→ {row.endDate}</span>
                        </div>
                    );
                },
                size: 120,
            }),
            // 9. Saldo
            columnHelper.accessor('balance', {
                id: 'LeaseBalance',
                header: 'Saldo',
                cell: (info) => {
                    const val = info.getValue() || 0;
                    const color = val < 0 ? 'text-red-600' : val > 0 ? 'text-[#72a333]' : 'text-gray-600';
                    return <span className={`text-sm font-medium ${color}`}>{formatCurrency(val)}</span>;
                },
                size: 110,
            }),
            // 10. Stato
            columnHelper.accessor('status', {
                id: 'LeaseStatus',
                header: 'Stato',
                cell: (info) => {
                    const val = info.getValue();
                    const isActive = val === 'attiva';
                    return (
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            {isActive ? 'Attiva' : 'Inattivo'}
                        </span>
                    );
                },
                size: 100,
            }),
            // 11. Modelli (Documenti)
            columnHelper.display({
                id: 'templates',
                header: 'Modelli',
                cell: ({ row, table }) => {
                    const links = row.original.templateLinks;
                    const leaseId = row.original.id;
                    const downloadClick = (table.options.meta as any)?.onDownloadClick;

                    if (!links) return <span className="text-sm text-gray-400">—</span>;

                    return (
                        <div className="flex items-center gap-2">
                            {links.pdf && (
                                <button
                                    title="Scarica PDF"
                                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); downloadClick?.(leaseId); }}
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                            )}
                            {links.word && (
                                <button
                                    title="Scarica Word"
                                    className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); downloadClick?.(leaseId); }}
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                            )}
                            {links.odt && (
                                <button
                                    title="Scarica ODT"
                                    className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); downloadClick?.(leaseId); }}
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                },
                size: 120,
                enableSorting: false,
            }),
            // 12. Azioni (Dropdown Placeholder)
            columnHelper.display({
                id: 'actions',
                header: '',
                cell: () => (
                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                ),
                size: 60,
                enableSorting: false,
            }),
        ],
        [onDownloadClick]
    );

    const table = useReactTable({
        data,
        columns,
        meta: {
            onDownloadClick
        },
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
                                                        <ArrowUp className="w-3.5 h-3.5 text-[#72a333]" />
                                                    ) : sorted === 'desc' ? (
                                                        <ArrowDown className="w-3.5 h-3.5 text-[#72a333]" />
                                                    ) : (
                                                        <ArrowUpDown className="w-3 h-3 hover:text-gray-500" />
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
                                    ? 'bg-[#72a333]/5 ring-inset ring-1 ring-[#72a333]/30'
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
                        {table.getRowModel().rows.length} di {data.length} locazioni
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
