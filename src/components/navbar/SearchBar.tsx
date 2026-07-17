import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Key, Search, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { NavbarSearchResult, SearchResultType } from '../../types/navbar';
import { getJsonDb, subscribeJsonDb } from '../../db/jsonDb';
import { tenantDisplayName } from '../../db/dataSelectors';
import { leaseRecordToListItem } from '../../db/leaseRepository';

function buildSearchIndex(): NavbarSearchResult[] {
    const db = getJsonDb();
    const results: NavbarSearchResult[] = [];

    db.properties.filter((property) => !property.archived).forEach((property) => {
        results.push({
            id: `prop-${property.id}`,
            label: property.formData.PropertyTitle || 'Unità senza nome',
            type: 'property',
            href: `/properties/units/${property.id}`,
            subtitle: [property.formData.PropertyAddress, property.formData.PropertyPostalCode, property.formData.PropertyCity].filter(Boolean).join(', '),
        });
    });

    db.tenants.filter((tenant) => !tenant.archived).forEach((tenant) => {
        results.push({
            id: `tenant-${tenant.id}`,
            label: tenantDisplayName(tenant),
            type: 'tenant',
            href: `/tenants/${tenant.id}`,
            subtitle: tenant.email || tenant.mobilePhone || tenant.phone || '',
        });
    });

    db.leases.forEach((lease) => {
        const item = leaseRecordToListItem(lease, db);
        results.push({
            id: `lease-${lease.id}`,
            label: `${item.tenantName} - ${item.propertyTitle}`,
            type: 'lease',
            href: `/leases/${lease.id}`,
            subtitle: lease.archived ? `${item.leaseTypeLabel} · Archiviata` : item.leaseTypeLabel,
        });
    });

    return results;
}

const typeIcons: Record<SearchResultType, typeof Home> = {
    property: Home,
    tenant: User,
    lease: Key,
    contact: User,
    document: Home,
    finance: Home,
};

const typeLabels: Record<SearchResultType, string> = {
    property: 'Proprietà',
    tenant: 'Inquilino',
    lease: 'Locazione',
    contact: 'Contatto',
    document: 'Documento',
    finance: 'Finanza',
};

interface SearchBarProps {
    query: string;
    onQueryChange: (q: string) => void;
}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [searchIndex, setSearchIndex] = useState<NavbarSearchResult[]>(() => buildSearchIndex());
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const refresh = () => setSearchIndex(buildSearchIndex());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    const results = useMemo(() => {
        if (query.length < 2) return [];
        const q = query.toLowerCase();
        return searchIndex
            .filter((result) => result.label.toLowerCase().includes(q) || (result.subtitle && result.subtitle.toLowerCase().includes(q)))
            .slice(0, 8);
    }, [query, searchIndex]);

    const showDropdown = isFocused && results.length > 0;

    const handleSelect = useCallback((href: string) => {
        onQueryChange('');
        setIsFocused(false);
        navigate(href);
    }, [navigate, onQueryChange]);

    useEffect(() => {
        if (!isFocused) return undefined;
        const handleClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsFocused(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isFocused]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsFocused(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div ref={containerRef} className="relative hidden sm:block">
            <div className={`flex items-center gap-2 rounded-lg border transition-all duration-200 ${isFocused ? 'w-64 border-brand-blue/40 bg-white shadow-sm' : 'w-44 border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                <Search className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Cerca..."
                    className="w-full bg-transparent py-1.5 pr-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
                {query && (
                    <button type="button" onClick={() => onQueryChange('')} className="mr-2 shrink-0 text-gray-400 hover:text-gray-600">
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full z-50 mt-1 max-h-96 w-80 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg"
                    >
                        {results.map((result) => {
                            const Icon = typeIcons[result.type];
                            return (
                                <button type="button"
                                    key={result.id}
                                    onClick={() => handleSelect(result.href)}
                                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                                >
                                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100">
                                        <Icon className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-gray-800">{result.label}</div>
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <span className="text-[11px] font-medium uppercase tracking-wide text-brand-blue/70">{typeLabels[result.type]}</span>
                                            {result.subtitle && (
                                                <>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="truncate text-xs text-gray-400">{result.subtitle}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
