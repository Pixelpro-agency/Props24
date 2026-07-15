/**
 * SearchBar — Barra di ricerca globale con typeahead.
 *
 * Cerca tra proprietà, inquilini e locazioni dai mock data.
 * Nascosta su mobile (sotto sm). Su desktop si espande al focus.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, User, Key, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { mockProperties } from '../../data/mockProperties';
import { mockTenants } from '../../data/mockTenants';
import { mockLeases } from '../../data/mockLeases';
import type { NavbarSearchResult, SearchResultType } from '../../types/navbar';

/* ── Build searchable index from mock data ────────────── */

function buildSearchIndex(): NavbarSearchResult[] {
    const results: NavbarSearchResult[] = [];

    // Properties
    mockProperties.forEach(p => {
        results.push({
            id: `prop-${p.id}`,
            label: p.title,
            type: 'property',
            href: `/properties/units/${p.id}`,
            subtitle: p.address,
        });
    });

    // Tenants
    mockTenants.forEach(t => {
        const label = t.type === 'company'
            ? (t.companyName || 'Azienda')
            : `${t.firstName || ''} ${t.lastName || ''}`.trim();
        results.push({
            id: `tenant-${t.id}`,
            label,
            type: 'tenant',
            href: `/tenants/${t.id}`,
            subtitle: t.email || '',
        });
    });

    // Leases
    mockLeases.forEach(l => {
        results.push({
            id: `lease-${l.id}`,
            label: `${l.tenantName} — ${l.propertyTitle}`,
            type: 'lease',
            href: `/leases`, // detail routes not yet implemented
            subtitle: l.leaseTypeLabel,
        });
    });

    return results;
}

const searchIndex = buildSearchIndex();

/* ── Icon per tipo risultato ──────────────────────────── */

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

/* ── Component ────────────────────────────────────────── */

interface SearchBarProps {
    query: string;
    onQueryChange: (q: string) => void;
}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    /* Fuzzy filter */
    const results = useMemo(() => {
        if (query.length < 2) return [];
        const q = query.toLowerCase();
        return searchIndex
            .filter(r =>
                r.label.toLowerCase().includes(q) ||
                (r.subtitle && r.subtitle.toLowerCase().includes(q))
            )
            .slice(0, 8);
    }, [query]);

    const showDropdown = isFocused && results.length > 0;

    /* Navigate to result */
    const handleSelect = useCallback((href: string) => {
        onQueryChange('');
        setIsFocused(false);
        navigate(href);
    }, [navigate, onQueryChange]);

    /* Close on outside click */
    useEffect(() => {
        if (!isFocused) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isFocused]);

    /* Keyboard: Escape */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsFocused(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div ref={containerRef} className="relative hidden sm:block">
            {/* Input */}
            <div className={`flex items-center gap-2 rounded-lg border transition-all duration-200 ${isFocused
                    ? 'w-64 border-brand-blue/40 bg-white shadow-sm'
                    : 'w-44 border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Cerca…"
                    className="w-full py-1.5 pr-2 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                />
                {query && (
                    <button
                        onClick={() => onQueryChange('')}
                        className="mr-2 text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Results dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 max-h-96 overflow-y-auto"
                    >
                        {results.map(result => {
                            const Icon = typeIcons[result.type];
                            return (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect(result.href)}
                                    className="flex items-start gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="mt-0.5 w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                        <Icon className="w-3.5 h-3.5 text-gray-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-800 truncate">
                                            {result.label}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[11px] font-medium text-brand-blue/70 uppercase tracking-wide">
                                                {typeLabels[result.type]}
                                            </span>
                                            {result.subtitle && (
                                                <>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="text-xs text-gray-400 truncate">
                                                        {result.subtitle}
                                                    </span>
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
