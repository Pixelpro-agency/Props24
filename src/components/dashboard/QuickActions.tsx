import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Key, ReceiptText, Plus, Minus } from 'lucide-react';
import clsx from 'clsx';
import { isKnownRoute } from '../../utils/routes';

interface ActionItem {
    id: string;
    label: string;
    icon: React.ElementType;
    href: string;
    colorClass: string;
    bgHoverClass: string;
    isComingSoon?: boolean;
}

const ACTIONS: ActionItem[] = [
    {
        id: 'new-property',
        label: 'Nuova proprietà',
        icon: Home,
        href: '/properties/new',
        colorClass: 'text-gray-700',
        bgHoverClass: 'hover:bg-gray-100',
    },
    {
        id: 'new-tenant',
        label: 'Nuovo inquilino',
        icon: User,
        href: '/tenants/new',
        colorClass: 'text-gray-700',
        bgHoverClass: 'hover:bg-gray-100',
    },
    {
        id: 'new-lease',
        label: 'Nuova locazione',
        icon: Key,
        href: '/leases/new',
        colorClass: 'text-gray-700',
        bgHoverClass: 'hover:bg-gray-100',
    },
    {
        id: 'receipts',
        label: 'Ricevute',
        icon: ReceiptText,
        href: '/payments',
        colorClass: 'text-gray-700',
        bgHoverClass: 'hover:bg-gray-100',
        isComingSoon: true,
    },
    {
        id: 'new-income',
        label: 'Aggiungi un\'entrata',
        icon: Plus,
        href: '/payments/new-income',
        colorClass: 'text-green-600',
        bgHoverClass: 'hover:bg-green-50',
        isComingSoon: true,
    },
    {
        id: 'new-expense',
        label: 'Aggiungi una spesa',
        icon: Minus,
        href: '/payments/new-expense',
        colorClass: 'text-red-600',
        bgHoverClass: 'hover:bg-red-50',
        isComingSoon: true,
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
};

export function QuickActions() {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
            {ACTIONS.map((action) => (
                <motion.div key={action.id} variants={itemVariants}>
                    {(() => {
                        const isMissingRoute = !isKnownRoute(action.href);
                        const missingRouteStyle = isMissingRoute
                            ? { color: '#ca8a04', backgroundColor: '#fef08a', borderColor: '#eab308' }
                            : undefined;

                        return (
                    <Link
                        to={action.href}
                        className={clsx(
                            'relative flex flex-col items-center justify-center p-4 h-full rounded-xl border bg-white shadow-sm transition-all duration-200 group overflow-hidden',
                            !isMissingRoute
                                ? `border-gray-200 ${action.bgHoverClass}`
                                : 'missing-route'
                        )}
                        style={missingRouteStyle}
                        title={action.label}
                    >
                        <ActionContent action={action} isMissingRoute={isMissingRoute} />
                    </Link>
                        );
                    })()}
                </motion.div>
            ))}
        </motion.div>
    );
}

function ActionContent({ action, isMissingRoute }: { action: ActionItem; isMissingRoute: boolean }) {
    return (
        <>
            {/* Coming soon badge */}
            {action.isComingSoon && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-4 -right-5 bg-yellow-400 text-yellow-900 text-[10px] font-bold py-1 px-5 shadow-sm transform rotate-45">
                        SOON
                    </div>
                </div>
            )}

            <div className={clsx(
                'flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 border border-gray-100 mb-3 group-hover:scale-110 transition-transform duration-300',
                action.colorClass
            )}
                style={isMissingRoute ? { color: '#ca8a04' } : undefined}
            >
                <action.icon className="w-6 h-6" strokeWidth={1.5} style={isMissingRoute ? { color: '#ca8a04' } : undefined} />
            </div>
            <span
                className="text-sm font-medium text-gray-700 text-center leading-tight"
                style={isMissingRoute ? { color: '#ca8a04' } : undefined}
            >
                {action.label}
            </span>
        </>
    );
}
