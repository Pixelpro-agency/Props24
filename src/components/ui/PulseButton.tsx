import { Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface PulseButtonProps {
    label: string;
    onClick?: () => void;
    href?: string;
    className?: string;
}

export function PulseButton({ label, onClick, href, className = '' }: PulseButtonProps) {
    const buttonContent = (
        <>
            {/* Pulse indicator */}
            <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>

            <Plus className="w-4 h-4" />
            {label}
        </>
    );

    const classes = clsx(
        'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
        'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
        'transition-colors duration-200 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-green-500/30',
        className,
    );

    if (href) {
        return (
            <a href={href} className={classes}>
                {buttonContent}
            </a>
        );
    }

    return (
        <button type="button" onClick={onClick} className={classes}>
            {buttonContent}
        </button>
    );
}
