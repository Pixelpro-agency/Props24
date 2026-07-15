import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    name: string;
    label: string;
    helpText?: string;
    required?: boolean;
    orientation?: 'vertical' | 'horizontal';
}

export function TextArea({ name, label, helpText, required, orientation = 'vertical', className, rows = 1, ...props }: TextAreaProps) {
    const { register, formState: { errors }, watch } = useFormContext();
    const error = errors[name]?.message as string | undefined;
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const { ref: registerRef, ...restRegister } = register(name);

    // Watch per rilevare cambiamenti di valore se viene precompilato (es. in modifica)
    const value = watch(name);

    const handleResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset per ricalcolare
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    // Auto-resize al mount e quando cambia il testo programmatico (es. reset form)
    useEffect(() => {
        handleResize();
    }, [value]);

    const baseInput = (
        <div className="flex-1 w-full">
            <textarea
                id={name}
                rows={rows}
                ref={(e) => {
                    registerRef(e);
                    textareaRef.current = e;
                }}
                {...restRegister}
                onInput={handleResize}
                className={clsx(
                    "block w-full rounded-md border text-base transition-colors py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 resize-none overflow-hidden min-h-[46px]",
                    error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900 placeholder-red-300"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                )}
                {...props}
            />
            {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
            {helpText && !error && <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>}
        </div>
    );

    if (orientation === 'horizontal') {
        return (
            <div className={twMerge(clsx("grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4", className))}>
                <label htmlFor={name} className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex-1 w-full max-w-[800px]">
                    {baseInput}
                </div>
            </div>
        );
    }

    return (
        <div className={twMerge(clsx("flex flex-col gap-1.5", className))}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            {baseInput}
        </div>
    );
}
