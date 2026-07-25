/**
 * AddMenu — Dropdown "Aggiungi" nella Navbar.
 *
 * Mostra le 16 quick-action per creare nuove entità.
 * Le voci expert vengono filtrate dal componente padre (hook useNavbar).
 * Reddito e Spesa hanno icone colorate (verde/rosso).
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    const dropdownRef = useRef<HTMLDivElement>(null);
    const closeRequestedRef = useRef(false);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

    const handleClose = useCallback(() => {
        setDropdownPosition(null);
        onClose();
    }, [onClose]);

    const handleToggle = () => {
        if (isOpen) setDropdownPosition(null);
        onToggle();
    };

    /* Close on outside click */
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                menuRef.current &&
                !menuRef.current.contains(target) &&
                !dropdownRef.current?.contains(target)
            ) {
                handleClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [handleClose, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            closeRequestedRef.current = false;
            return;
        }

        closeRequestedRef.current = false;

        const updatePosition = () => {
            const triggerBounds = menuRef.current?.getBoundingClientRect();
            if (!triggerBounds) return;

            const triggerIsVisible =
                triggerBounds.width > 0 &&
                triggerBounds.height > 0 &&
                triggerBounds.bottom > 0 &&
                triggerBounds.top < window.innerHeight &&
                triggerBounds.right > 0 &&
                triggerBounds.left < window.innerWidth;

            if (!triggerIsVisible) {
                if (!closeRequestedRef.current) {
                    closeRequestedRef.current = true;
                    handleClose();
                }
                return;
            }

            const viewportMargin = 8;
            const dropdownWidth = dropdownRef.current?.offsetWidth || 224;
            const maximumLeft = Math.max(
                viewportMargin,
                window.innerWidth - dropdownWidth - viewportMargin,
            );
            const nextPosition = {
                top: triggerBounds.bottom + 4,
                left: Math.min(
                    Math.max(triggerBounds.left, viewportMargin),
                    maximumLeft,
                ),
            };

            setDropdownPosition((currentPosition) => {
                if (
                    currentPosition?.top === nextPosition.top &&
                    currentPosition.left === nextPosition.left
                ) {
                    return currentPosition;
                }
                return nextPosition;
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [handleClose, isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger */}
            <button
                onClick={handleToggle}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-blue rounded-lg hover:bg-gray-100 transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <PlusCircle className="w-4 h-4 navbar-icon-hover" />
                <span className="hidden sm:inline">Aggiungi</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && dropdownPosition && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={dropdownPosition}
                        className="fixed z-50 w-56 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg navbar-dropdown-scroll"
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
                                        onClick={handleClose}
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
                </AnimatePresence>,
                document.body,
            )}
        </div>
    );
}
