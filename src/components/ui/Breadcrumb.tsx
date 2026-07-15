import { Home, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface BreadcrumbItem {
    label?: string;
    href?: string;
    icon?: 'home';
    active?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className={clsx('flex items-center gap-1 text-sm', className)}>
            {items.map((item, index) => (
                <span key={index} className="flex items-center gap-1">
                    {index > 0 && (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-0.5" />
                    )}
                    {item.active ? (
                        <span className="text-gray-500 font-medium flex items-center gap-1">
                            {item.icon === 'home' && <Home className="w-4 h-4" />}
                            {item.label}
                        </span>
                    ) : (
                        <a
                            href={item.href ?? '#'}
                            className="text-blue-600 hover:underline flex items-center gap-1 transition-colors duration-150"
                        >
                            {item.icon === 'home' && <Home className="w-4 h-4" />}
                            {item.label}
                        </a>
                    )}
                </span>
            ))}
        </nav>
    );
}
