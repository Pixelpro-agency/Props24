import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CompositeFieldProps {
    label: string;
    children: ReactNode;
    required?: boolean;
    className?: string;
    helpText?: string;
}

export function CompositeField({ label, children, required, className, helpText }: CompositeFieldProps) {
    return (
        <div className={twMerge(clsx("flex flex-col gap-1.5", className))}>
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="flex items-start gap-2 sm:gap-4">
                {/* Child elements like inputs/selects will flex proportionally or as styled by themselves */}
                {children}
            </div>

            {helpText && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
        </div>
    );
}
