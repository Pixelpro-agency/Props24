import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FormSectionProps {
    title: string;
    children: ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
    className?: string;
}

export function FormSection({
    title,
    children,
    collapsible = false,
    defaultOpen = true,
    className
}: FormSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={twMerge(clsx("mb-8", className))}>
            <div
                className={clsx(
                    "pb-3 mb-6 flex items-center justify-between border-b border-gray-100",
                    collapsible && "cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-lg px-2"
                )}
                onClick={() => collapsible && setIsOpen(!isOpen)}
            >
                <h3 className="text-base font-medium text-gray-800">{title}</h3>
                {collapsible && (
                    <button type="button" className="text-gray-400 hover:text-gray-600">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="px-2">
                    <div className="flex flex-col gap-5">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}
