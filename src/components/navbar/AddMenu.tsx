/**
 * AddMenu — Dropdown "Aggiungi" nella Navbar.
 *
 * Mostra le 16 quick-action per creare nuove entità.
 * Le voci expert vengono filtrate dal componente padre (hook useNavbar).
 * Reddito e Spesa hanno icone colorate (verde/rosso).
 */

import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { NavbarMenuItem } from '../../types/navbar';
import { isKnownRoute } from '../../utils/routes';

interface AddMenuProps {
    items: NavbarMenuItem[];
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export function AddMenu({ items, isOpen, onToggle, onClose }: AddMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    /* Close on outside click */
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onClose]);

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger */}
            <button
                onClick={onToggle}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-blue rounded-lg hover:bg-gray-100 transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <PlusCircle className="w-4 h-4 navbar-icon-hover" />
                <span className="hidden sm:inline">Aggiungi</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 max-h-[70vh] overflow-y-auto navbar-dropdown-scroll"
                    >
                        {items.map((item) => {
                            const isMissingRoute = Boolean(item.href && !isKnownRoute(item.href));
                            const missingRouteStyle = isMissingRoute
                                ? { color: '#ca8a04', backgroundColor: '#fef08a', borderColor: '#eab308' }
                                : undefined;
                            const itemClassName = `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isMissingRoute
                                ? 'missing-route'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`;

                            const content = (
                                <>
                                    {item.icon && (
                                        <item.icon
                                            className={`w-4 h-4 shrink-0 ${item.iconColor || 'text-gray-400'}`}
                                            style={isMissingRoute ? { color: '#ca8a04' } : undefined}
                                        />
                                    )}
                                    <span>{item.label}</span>
                                </>
                            );

                            return (
                                <div key={item.id}>
                                    <Link
                                        to={item.href || '#'}
                                        onClick={onClose}
                                        className={itemClassName}
                                        style={missingRouteStyle}
                                    >
                                        {content}
                                    </Link>
                                    {item.dividerAfter && (
                                        <div className="mx-3 my-0.5 border-t border-gray-100" />
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
