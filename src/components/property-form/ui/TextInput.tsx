import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name: string;
    label: string;
    error?: string;
    orientation?: 'vertical' | 'horizontal';
    helpText?: string;
    required?: boolean;
}

export function TextInput({
    name,
    label,
    error: propError, // Rename propError to avoid conflict with formState error
    className,
    orientation = 'vertical',
    helpText,
    required,
    ...props
}: TextInputProps) {
    const { register, formState: { errors } } = useFormContext();
    const formError = errors[name]?.message as string | undefined;
    const error = propError || formError; // Use propError if provided, otherwise use formState error

    const baseInput = (
        <div className="flex-1 w-full">
            <input
                id={name}
                {...register(name)}
                className={clsx(
                    "block w-full rounded-md border text-base transition-colors py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50",
                    error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900 placeholder-red-300"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                )}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>
            )}
            {helpText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>
            )}
        </div>
    );

    if (orientation === 'horizontal') {
        return (
            <div className={twMerge(clsx("grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4", className))}>
                <label htmlFor={name} className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex-1 w-full max-w-[500px]">
                    {baseInput}
                </div>
            </div>
        );
    }

    return (
        <div className={twMerge(clsx("flex flex-col gap-1.5", className))}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {baseInput}
        </div>
    );
}
