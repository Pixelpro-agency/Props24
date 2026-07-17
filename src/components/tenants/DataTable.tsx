import { useEffect, useMemo, useState } from 'react';
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
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TenantListItem } from '../../db/tenantRepository';
import { TENANT_STATUS_CONFIG } from '../../db/tenantRepository';

interface DataTableProps {
    data: TenantListItem[];
    pageSize?: number;
    columnVisibility: VisibilityState;
    onColumnVisibilityChange: (vis: VisibilityState) => void;
    rowSelection: RowSelectionState;
    onRowSelectionChange: (sel: RowSelectionState) => void;
    onSendInvite?: (tenantId: string) => void | Promise<void>;
    sendingInviteId?: string | null;
}

const columnHelper = createColumnHelper<TenantListItem>();

function formatBalance(value: number): string {
    if (value === 0) return '€ 0,00';
    const formatted = Math.abs(value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `- € ${formatted}` : `€ ${formatted}`;
}

export function DataTable({
    data,
    pageSize = 100,
    columnVisibility,
    onColumnVisibilityChange,
    rowSelection,
    onRowSelectionChange,
    onSendInvite,
    sendingInviteId,
}: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'select',
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-green-600 accent-green-600 focus:ring-green-500"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        onClick={(event) => event.stopPropagation()}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-green-600 accent-green-600 focus:ring-green-500"
                    />
                ),
                size: 40,
                enableSorting: false,
            }),
            columnHelper.accessor('displayName', {
                id: 'displayName',
                header: 'Inquilino',
                cell: (info) => {
                    const row = info.row.original;
                    const initials = row.type === 'company'
                        ? row.displayName.charAt(0).toUpperCase()
                        : row.displayName.split(' ').map((name) => name.charAt(0)).join('').slice(0, 2).toUpperCase();

                    return (
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: row.avatarColor }}
                            >
                                {initials}
                            </div>
                            <div>
                                <Link to={`/tenants/${row.id}`} className="block cursor-pointer font-medium text-gray-800 transition-colors hover:text-green-600">
                                    {info.getValue()}
                                </Link>
                                <div className="text-xs text-gray-500">{row.subtitle}</div>
                            </div>
                        </div>
                    );
                },
                size: 280,
            }),
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
            columnHelper.accessor('propertyName', {
                id: 'propertyName',
                header: 'Proprietà',
                cell: (info) => {
                    const value = info.getValue();
                    return (
                        <span className={`text-sm ${value ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                            {value ?? 'Nessuna'}
                        </span>
                    );
                },
                size: 180,
            }),
            columnHelper.accessor('mobilePhone', {
                id: 'mobilePhone',
                header: 'Telefono',
                cell: (info) => <span className="text-sm text-gray-600">{info.getValue() ?? '—'}</span>,
                size: 140,
            }),
            columnHelper.accessor('email', {
                id: 'email',
                header: 'Email',
                cell: (info) => {
                    const value = info.getValue();
                    return value ? (
                        <a href={`mailto:${value}`} className="text-sm text-blue-600 hover:underline">
                            {value}
                        </a>
                    ) : (
                        <span className="text-sm text-gray-400">—</span>
                    );
                },
                size: 180,
            }),
            columnHelper.accessor('balance', {
                id: 'balance',
                header: 'Saldo',
                cell: (info) => {
                    const value = info.getValue();
                    const color = value < 0 ? 'text-red-600' : value > 0 ? 'text-green-600' : 'text-gray-600';
                    return <span className={`text-sm font-medium ${color}`}>{formatBalance(value)}</span>;
                },
                size: 120,
            }),
            columnHelper.accessor('status', {
                id: 'status',
                header: 'Stato',
                cell: (info) => {
                    const cfg = TENANT_STATUS_CONFIG[info.getValue()];
                    return (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color} ${cfg.textColor}`}>
                            {cfg.label}
                        </span>
                    );
                },
                size: 100,
            }),
            columnHelper.display({
                id: 'invitation',
                header: 'Invito',
                cell: ({ row }) => {
                    const tenant = row.original;
                    const isSending = sendingInviteId === tenant.id;
                    if (!tenant.invitationEmail) return <span className="text-sm text-gray-400">—</span>;
                    if (tenant.invitationStatus === 'accepted') {
                        return <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">ACCETTATO</span>;
                    }
                    if (tenant.invitationStatus === 'pending') {
                        return (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">IN ATTESA</span>
                                <button
                                    type="button"
                                    disabled={isSending}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        void onSendInvite?.(tenant.id);
                                    }}
                                    className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSending ? 'INVIO...' : "MANDA DI NUOVO L'INVITO"}
                                </button>
                            </div>
                        );
                    }
                    return (
                        <button
                            type="button"
                            disabled={!tenant.canSendInvitation || isSending}
                            onClick={(event) => {
                                event.stopPropagation();
                                void onSendInvite?.(tenant.id);
                            }}
                            className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSending ? 'INVIO...' : 'INVIA INVITO'}
                        </button>
                    );
                },
                size: 220,
            }),
        ],
        [onSendInvite, sendingInviteId],
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
            const nextVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
            onColumnVisibilityChange(nextVisibility);
        },
        onRowSelectionChange: (updater) => {
            const nextSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
            onRowSelectionChange(nextSelection);
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

    useEffect(() => {
        table.setPageSize(pageSize);
    }, [pageSize, table]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full" role="grid">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b border-gray-200">
                            {headerGroup.headers.map((header) => {
                                const canSort = header.column.getCanSort();
                                const sorted = header.column.getIsSorted();
                                return (
                                    <th
                                        key={header.id}
                                        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${canSort ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                                        style={{ width: header.getSize() }}
                                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {canSort && (
                                                <span className="text-gray-400">
                                                    {sorted === 'asc' ? (
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    ) : sorted === 'desc' ? (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowUpDown className="h-3 w-3" />
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
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.id}
                            className={`border-b border-gray-100 transition-all duration-150 ${row.getIsSelected() ? 'bg-green-50 ring-1 ring-inset ring-green-200' : 'hover:bg-gray-50'}`}
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

            {data.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 px-4 py-3 text-sm text-gray-500 sm:flex-row">
                    <span>{table.getRowModel().rows.length} di {data.length} inquilini</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Prec.
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                        </span>
                        <button
                            type="button"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Succ.
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
