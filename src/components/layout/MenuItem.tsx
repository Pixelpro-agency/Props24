import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, PlusCircle, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import type { MenuItem as MenuItemType } from '../../types/menu';
import { Badge, BadgeList } from './Badge';
import { isKnownRoute } from '../../utils/routes';

interface MenuItemProps {
    item: MenuItemType;
    isActive?: boolean;
    isExpanded?: boolean;
    level?: number;
    onToggle?: () => void;
    onNavigate?: () => void;
}

export function MenuItem({
    item,
    isActive = false,
    isExpanded = false,
    level = 0,
    onToggle,
    onNavigate,
}: MenuItemProps) {
    const hasChildren = item.children && item.children.length > 0;
    const location = useLocation();
    const navigate = useNavigate();
    const paddingLeft = level === 0 ? 'px-3' : 'pl-10 pr-3';

    const isMissingRoute = Boolean(item.href && !isKnownRoute(item.href));
    const missingRouteStyle = isMissingRoute
        ? { color: '#ca8a04', backgroundColor: '#fef08a', borderColor: '#eab308' }
        : undefined;

    // Per i NavLink, usiamo il path corrente per determinare l'active
    const isRouteActive = item.href ? location.pathname === item.href : false;
    const activeState = isActive || isRouteActive;

    const baseClasses = clsx(
        "w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group",
        paddingLeft,
        isMissingRoute
            ? 'missing-route border'
            : activeState
            ? 'bg-brand-blue/10 text-brand-blue relative'
            : 'text-slate-600 hover:bg-gray-200'
    );

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (item.quickAddHref) {
            navigate(item.quickAddHref);
            if (onNavigate) onNavigate();
        }
    };

    const handleQuickAddAction = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(href);
        if (onNavigate) onNavigate();
    };

    const content = (
        <>
            {activeState && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-brand-blue rounded-r-md" />
            )}

            {item.icon && (
                <item.icon
                    className={clsx(
                        "w-5 h-5 mr-3 shrink-0",
                        activeState ? "text-brand-blue" : "text-slate-400 group-hover:text-slate-600"
                    )}
                    style={isMissingRoute ? { color: '#ca8a04' } : undefined}
                    strokeWidth={2}
                />
            )}

            <span className="truncate">{item.label}</span>

            {item.isBeta && (
                <span className="ml-1 text-[10px] text-brand-red font-bold uppercase tracking-wider mb-1">
                    Beta
                </span>
            )}

            <div className="ml-auto flex items-center gap-2">
                {/* QuickAdd singolo (standard) */}
                {item.quickAdd && !item.quickAddActions && (
                    <div className="relative group/tooltip flex items-center justify-center">
                        <button
                            onClick={handleQuickAdd}
                            aria-label="Nuovo"
                            className={clsx(
                                'opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-brand-blue focus:opacity-100 rounded-full',
                                item.quickAddHref && !isKnownRoute(item.quickAddHref) ? 'missing-route-text' : 'text-slate-400'
                            )}
                        >
                            <PlusCircle className="w-4 h-4" />
                        </button>

                        {/* Tooltip */}
                        <div className="absolute right-0 top-1/2 -translate-y-[150%] mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                            <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                Nuovo
                            </div>
                            <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-800 rotate-45 transform" />
                        </div>
                    </div>
                )}

                {/* QuickAdd multiplo (es. Finanze: Nuova spesa + Nuovo reddito) */}
                {item.quickAddActions && item.quickAddActions.map((action, idx) => (
                    <div key={idx} className="relative group/tooltip flex items-center justify-center">
                        <button
                            onClick={(e) => handleQuickAddAction(e, action.href)}
                            aria-label={action.tooltip}
                            className={clsx(
                                'opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-brand-blue focus:opacity-100 rounded-full',
                                !isKnownRoute(action.href) ? 'missing-route-text' : 'text-slate-400'
                            )}
                        >
                            <action.icon className="w-4 h-4" />
                        </button>

                        {/* Tooltip */}
                        <div className="absolute right-0 top-1/2 -translate-y-[150%] mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                            <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                {action.tooltip}
                            </div>
                            <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-800 rotate-45 transform" />
                        </div>
                    </div>
                ))}

                {/* Ellipsis "⋯" su hover */}
                {item.ellipsis && (
                    <div className="relative group/ellipsis flex items-center justify-center">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            aria-label="Altre opzioni"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-brand-blue text-slate-400 focus:opacity-100 rounded-full"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Badge multipli (nuovo) */}
                {item.badges && <BadgeList badges={item.badges} />}

                {/* Badge singolo (legacy) */}
                {item.badge && <Badge type={item.badge.type} count={item.badge.count} />}

                {hasChildren && (
                    <ChevronDown
                        className={clsx(
                            "w-4 h-4 text-slate-400 transition-transform duration-200",
                            isExpanded && "rotate-180"
                        )}
                    />
                )}
            </div>
        </>
    );

    // Se ha figli -> bottone per aprire l'accordion
    if (hasChildren) {
        return (
            <button onClick={onToggle} className={baseClasses}>
                {content}
            </button>
        );
    }

    // Altrimenti NavLink
    return (
        <NavLink
            to={item.href || '#'}
            onClick={onNavigate}
            className={baseClasses}
            style={missingRouteStyle}
        >
            {content}
        </NavLink>
    );
}
