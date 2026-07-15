/**
 * Navbar — Top bar principale dell'applicazione.
 *
 * Assembla tutti i sotto-componenti:
 * - Sinistra: AddMenu + AgendaWidget
 * - Destra: SearchBar + AlertsDropdown + HelpMenu + SettingsMenu
 *
 * Riceve expertMode dal Layout (verrà condiviso via Context in Task 11).
 */

import './Navbar.css';
import { useNavbar } from '../../hooks/useNavbar';
import { AddMenu } from './AddMenu';
import { AgendaWidget } from './AgendaWidget';
import { SearchBar } from './SearchBar';
import { AlertsDropdown } from './AlertsDropdown';
import { HelpMenu } from './HelpMenu';
import { SettingsMenu } from './SettingsMenu';
import { Loader2 } from 'lucide-react';

interface NavbarProps {
    expertMode: boolean;
    /** Whether a global action is loading */
    isLoading?: boolean;
}

export function Navbar({ expertMode, isLoading = false }: NavbarProps) {
    const {
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
    } = useNavbar(expertMode);

    return (
        <header className="hidden lg:flex h-12 shrink-0 items-center justify-between px-4 bg-white border-b border-gray-200 z-30">

            {/* ── Left side ── */}
            <div className="flex items-center gap-1">
                <AddMenu
                    items={filteredAddItems}
                    isOpen={openDropdown === 'add'}
                    onToggle={() => toggleDropdown('add')}
                    onClose={closeAllDropdowns}
                />

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <AgendaWidget count={0} />

                {/* Loading spinner */}
                {isLoading && (
                    <div className="ml-3">
                        <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                    </div>
                )}
            </div>

            {/* ── Right side ── */}
            <div className="flex items-center gap-1">
                <SearchBar
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                />

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <AlertsDropdown
                    alerts={alerts}
                    activeCount={activeAlertCount}
                    hasDismissedAlerts={hasDismissedAlerts}
                    isOpen={openDropdown === 'alerts'}
                    onToggle={() => toggleDropdown('alerts')}
                    onClose={closeAllDropdowns}
                    onDismiss={dismissAlert}
                    onReset={resetAlerts}
                />

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <HelpMenu
                    items={filteredHelpItems}
                    isOpen={openDropdown === 'help'}
                    onToggle={() => toggleDropdown('help')}
                    onClose={closeAllDropdowns}
                />

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <SettingsMenu
                    sections={filteredSettingsSections}
                    isOpen={openDropdown === 'settings'}
                    onToggle={() => toggleDropdown('settings')}
                    onClose={closeAllDropdowns}
                />
            </div>
        </header>
    );
}
