/**
 * AlertsDropdown — Dropdown avvisi nella Navbar.
 *
 * Mostra gli avvisi attivi con azioni "Visualizza" e "Nascondi".
 * Header con pulsante reset (visibile solo se ci sono avvisi nascosti).
 * Footer con link "Vedi tutti gli avvisi".
 */

import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { NavbarAlert } from '../../types/navbar';
import { isKnownRoute } from '../../utils/routes';

interface AlertsDropdownProps {
    alerts: NavbarAlert[];
    activeCount: number;
    hasDismissedAlerts: boolean;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onDismiss: (hash: string) => void;
    onReset: () => void;
}

export function AlertsDropdown({
    alerts,
    activeCount,
    hasDismissedAlerts,
    isOpen,
    onToggle,
    onClose,
    onDismiss,
    onReset,
}: AlertsDropdownProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    /* Close on outside click */
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
                setConfirmReset(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onClose]);

    const activeAlerts = alerts.filter(a => !a.dismissed);

    const handleReset = () => {
        if (!confirmReset) {
            setConfirmReset(true);
            return;
        }
        onReset();
        setConfirmReset(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger */}
            <button
                onClick={onToggle}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-brand-blue hover:bg-gray-100 transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Bell className="w-[18px] h-[18px] navbar-icon-hover" />

                {/* Badge */}
                {activeCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-brand-red rounded-full leading-none navbar-badge-pulse">
                        {activeCount > 99 ? '99+' : activeCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800">Avvisi</h3>
                            {hasDismissedAlerts && (
                                <button
                                    onClick={handleReset}
                                    className={`flex items-center gap-1.5 text-xs transition-colors ${confirmReset
                                        ? 'text-brand-red font-medium'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    title="Reimpostare gli avvisi?"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    {confirmReset ? 'Conferma?' : 'Resetta'}
                                </button>
                            )}
                        </div>

                        {/* Alerts list */}
                        <div className="max-h-72 overflow-y-auto navbar-dropdown-scroll">
                            {activeAlerts.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-gray-400">
                                    Nessun avviso attivo
                                </div>
                            ) : (
                                activeAlerts.map((alert, index) => (
                                    <AlertItem
                                        key={alert.id}
                                        alert={alert}
                                        onDismiss={onDismiss}
                                        onClose={onClose}
                                        showDivider={index < activeAlerts.length - 1}
                                    />
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100">
                            <Link
                                to="/alerts"
                                onClick={onClose}
                                className="missing-route block text-center text-xs font-medium py-2.5 transition-colors"
                                style={{ color: '#ca8a04', backgroundColor: '#fef08a', borderColor: '#eab308' }}
                            >
                                Vedi tutti gli avvisi
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Single Alert Item ────────────────────────────────── */

interface AlertItemProps {
    alert: NavbarAlert;
    onDismiss: (hash: string) => void;
    onClose: () => void;
    showDivider: boolean;
}

function AlertItem({ alert, onDismiss, onClose, showDivider }: AlertItemProps) {
    const Icon = alert.icon;
    const isMissingRoute = !isKnownRoute(alert.viewHref);

    return (
        <>
            <div className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex gap-3">
                    {/* Icon */}
                    <div className="mt-0.5 shrink-0">
                        <Icon className={`w-5 h-5 ${alert.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700">{alert.title}</p>
                        <p
                            className="text-xs text-gray-500 mt-0.5 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: alert.body }}
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2">
                            <Link
                                to={alert.viewHref}
                                onClick={onClose}
                                className={`text-xs font-medium transition-colors ${isMissingRoute
                                    ? 'missing-route px-1.5 py-0.5 rounded'
                                    : 'text-brand-blue hover:text-brand-blue/80'
                                    }`}
                                style={isMissingRoute ? { color: '#ca8a04', backgroundColor: '#fef08a', borderColor: '#eab308' } : undefined}
                            >
                                Visualizza
                            </Link>
                            <button
                                onClick={() => onDismiss(alert.hash)}
                                className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Nascondi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showDivider && <div className="mx-4 border-t border-gray-100" />}
        </>
    );
}
