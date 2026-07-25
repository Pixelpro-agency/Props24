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
import { Loader2, Menu } from 'lucide-react';

interface NavbarProps {
    expertMode: boolean;
    onOpenMobileMenu: () => void;
    isMobileMenuOpen: boolean;
    /** Whether a global action is loading */
    isLoading?: boolean;
}

export function Navbar({ expertMode, onOpenMobileMenu, isMobileMenuOpen, isLoading = false }: NavbarProps) {
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
        <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 lg:h-12 lg:px-4">

            {/* ── Left side ── */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="Apri menu principale"
                    aria-controls="props24-sidebar"
                    aria-expanded={isMobileMenuOpen}
                    onClick={onOpenMobileMenu}
                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 lg:hidden"
                >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </button>

                <span className="text-lg font-bold tracking-tight text-brand-blue lg:text-xl">Props24</span>

                <div className="hidden h-5 w-px bg-gray-200 lg:block" />

                <div className="hidden items-center gap-1 lg:flex">
                    <AddMenu
                        items={filteredAddItems}
                        isOpen={openDropdown === 'add'}
                        onToggle={() => toggleDropdown('add')}
                        onClose={closeAllDropdowns}
                    />

                    <div className="mx-1 h-5 w-px bg-gray-200" />

                    <AgendaWidget count={0} />

                    {isLoading && (
                        <div className="ml-3">
                            <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right side ── */}
            <div className="hidden items-center gap-1 lg:flex">
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
