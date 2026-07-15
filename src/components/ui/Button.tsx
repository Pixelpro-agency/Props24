import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
};

export function Button({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    disabled,
    children,
    className = '',
    ...rest
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-md font-medium',
                'transition-colors duration-200 cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-green-500/30',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...rest}
        >
            {loading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </button>
    );
}
