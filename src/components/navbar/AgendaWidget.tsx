/**
 * AgendaWidget — Link rapido all'Agenda nella Navbar.
 *
 * Mostra icona calendario con badge conteggio (nascosto se 0)
 * e tooltip "Agenda".
 */

import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';

interface AgendaWidgetProps {
    /** Number of upcoming events (badge hidden when 0) */
    count?: number;
}

export function AgendaWidget({ count = 0 }: AgendaWidgetProps) {
    return (
        <Link
            to="/agenda"
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-brand-blue hover:bg-gray-100 transition-colors"
            title="Agenda"
        >
            <CalendarDays className="w-[18px] h-[18px] navbar-icon-hover" />

            {/* Badge */}
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-brand-orange rounded-full leading-none">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Link>
    );
}
