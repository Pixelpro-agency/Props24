import { useState, useRef, useEffect } from 'react';
import { Search, ArrowUpDown, Settings, ChevronDown, Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisibilityState } from '@tanstack/react-table';

interface TableToolbarProps {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    columnVisibility: VisibilityState;
    onColumnVisibilityChange: (vis: VisibilityState) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onExportClick?: () => void;
}

const pageSizeOptions = [5, 10, 20, 30, 40, 50, 100];

const toggleableColumns = [
    { id: 'type', label: 'Tipo' },
    { id: 'surface', label: 'Superficie' },
    { id: 'rooms', label: 'Vani' },
    { id: 'tenant', label: 'Inquilino' },
    { id: 'rent', label: 'Affitto' },
    { id: 'visibility', label: 'Visibilità' },
];

type OpenDropdown = null | 'pageSize' | 'columns';

export function TableToolbar({
    pageSize,
    onPageSizeChange,
    columnVisibility,
    onColumnVisibilityChange,
    searchQuery,
    onSearchChange,
    onExportClick,
}: TableToolbarProps) {
    const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdowns on click outside
    useEffect(() => {
        if (!openDropdown) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [openDropdown]);

    // Focus search input when opened
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    function toggleDropdown(key: OpenDropdown) {
        setOpenDropdown((prev) => (prev === key ? null : key));
    }

    function handleColumnToggle(colId: string) {
        onColumnVisibilityChange({
            ...columnVisibility,
            [colId]: !(columnVisibility[colId] ?? true),
        });
    }

    return (
        <div
            ref={containerRef}
            className="flex items-center justify-between px-4 py-2 border-b border-gray-200"
        >
            {/* Left — Page size */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => toggleDropdown('pageSize')}
                    className="inline-flex items-center gap-1.5 border border-gray-200 rounded px-3 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    {pageSize} Linee
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                    {openDropdown === 'pageSize' && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[100px]"
                        >
                            {pageSizeOptions.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                        onPageSizeChange(size);
                                        setOpenDropdown(null);
                                    }}
                                    className={`
                    w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors
                    ${size === pageSize ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}
                  `}
                                >
                                    {size}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right — Action icons */}
            <div className="flex items-center gap-1">
                {/* Export button */}
                {onExportClick && (
                    <button
                        type="button"
                        onClick={onExportClick}
                        className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Esporta"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                )}
                {/* Inline search */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 200, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="relative">
                                <input
                                    ref={searchInputRef}
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Cerca…"
                                    className="w-full pl-3 pr-8 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchOpen(false);
                                        onSearchChange('');
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!searchOpen && (
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Cerca"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                )}

                {/* Sort icon */}
                <button
                    type="button"
                    className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Ordina"
                >
                    <ArrowUpDown className="w-4 h-4" />
                </button>

                {/* Columns visibility */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => toggleDropdown('columns')}
                        className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Colonne"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                        {openDropdown === 'columns' && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-2 min-w-[180px]"
                            >
                                <div className="px-3 pb-1.5 text-xs font-semibold text-gray-400 uppercase">
                                    Colonne visibili
                                </div>
                                {toggleableColumns.map((col) => {
                                    const isVisible = columnVisibility[col.id] ?? true;
                                    return (
                                        <label
                                            key={col.id}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isVisible}
                                                onChange={() => handleColumnToggle(col.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600"
                                            />
                                            {col.label}
                                        </label>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
