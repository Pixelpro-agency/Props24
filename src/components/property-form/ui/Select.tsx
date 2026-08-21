import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    name: string;
    label: string;
    options: SelectOption[];
    helpText?: string;
    required?: boolean;
    orientation?: 'vertical' | 'horizontal';
}

export function Select({ name, label, options, helpText, required, orientation = 'vertical', className, ...props }: SelectProps) {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[name]?.message as string | undefined;

    const baseInput = (
        <div className="flex-1 w-full">
            <select
                id={name}
                {...register(name)}
                className={clsx(
                    "block w-full rounded-md border text-base transition-colors py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 appearance-none bg-white",
                    error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                )}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: `right 0.5rem center`,
                    backgroundRepeat: `no-repeat`,
                    backgroundSize: `1.5em 1.5em`,
                    paddingRight: `2.5rem`
                }}
                {...props}
            >
                <option value="" disabled hidden>Seleziona un'opzione</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            {helpText && !error && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
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
