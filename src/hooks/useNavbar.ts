/**
 * Hook per la gestione della Navbar.
 *
 * Gestisce: apertura/chiusura dropdown, avvisi (dismiss/reset),
 * ricerca con filtro, e filtraggio expert mode.
 *
 * NOTE: expertMode viene passato dall'esterno. In Task 11 verrà
 * condiviso tra Sidebar e Navbar tramite React Context.
 */

import { useState, useCallback, useMemo } from 'react';
import { mockAlerts, addMenuItems, helpMenuItems, settingsSections } from '../data/navbar';
import type { NavbarAlert, NavbarMenuItem, NavbarDropdownSection } from '../types/navbar';

/* ── Dropdown keys ────────────────────────────────────── */

type DropdownKey = 'add' | 'alerts' | 'help' | 'settings';

/* ── Return type ──────────────────────────────────────── */

interface UseNavbarReturn {
    /* Dropdown state */
    openDropdown: DropdownKey | null;
    toggleDropdown: (key: DropdownKey) => void;
    closeAllDropdowns: () => void;

    /* Search */
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    /* Alerts */
    alerts: NavbarAlert[];
    activeAlertCount: number;
    dismissAlert: (hash: string) => void;
    resetAlerts: () => void;
    hasDismissedAlerts: boolean;

    /* Menu items (filtered by expert mode) */
    filteredAddItems: NavbarMenuItem[];
    filteredHelpItems: NavbarMenuItem[];
    filteredSettingsSections: NavbarDropdownSection[];
}

/* ── Hook ─────────────────────────────────────────────── */

export function useNavbar(expertMode: boolean): UseNavbarReturn {
    /* ─ Dropdown state ─ */
    const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

    const toggleDropdown = useCallback((key: DropdownKey) => {
        setOpenDropdown(prev => (prev === key ? null : key));
    }, []);

    const closeAllDropdowns = useCallback(() => {
        setOpenDropdown(null);
    }, []);

    /* ─ Search ─ */
    const [searchQuery, setSearchQuery] = useState('');

    /* ─ Alerts ─ */
    const [alerts, setAlerts] = useState<NavbarAlert[]>(mockAlerts);

    const dismissAlert = useCallback((hash: string) => {
        setAlerts(prev =>
            prev.map(a => (a.hash === hash ? { ...a, dismissed: true } : a))
        );
    }, []);

    const resetAlerts = useCallback(() => {
        setAlerts(prev => prev.map(a => ({ ...a, dismissed: false })));
    }, []);

    const activeAlertCount = useMemo(
        () => alerts.filter(a => !a.dismissed).length,
        [alerts]
    );

    const hasDismissedAlerts = useMemo(
        () => alerts.some(a => a.dismissed),
        [alerts]
    );

    /* ─ Expert mode filtering ─ */
    const filteredAddItems = useMemo(
        () => addMenuItems.filter(item => expertMode || !item.isExpert),
        [expertMode]
    );

    const filteredHelpItems = useMemo(
        () => helpMenuItems.filter(item => expertMode || !item.isExpert),
        [expertMode]
    );

    const filteredSettingsSections = useMemo(
        () =>
            settingsSections.map(section => ({
                ...section,
                items: section.items.filter(item => expertMode || !item.isExpert),
            })),
        [expertMode]
    );

    return {
        openDropdown,
        toggleDropdown,
        closeAllDropdowns,
        searchQuery,
        setSearchQuery,
        alerts,
        activeAlertCount,
        dismissAlert,
        resetAlerts,
        hasDismissedAlerts,
        filteredAddItems,
        filteredHelpItems,
        filteredSettingsSections,
    };
}
