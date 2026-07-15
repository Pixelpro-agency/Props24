// Wrapper React per intl-tel-input — input telefonico con bandiere nazionali
// Utilizza il componente React ufficiale di intl-tel-input con utils integrati
import IntlTelInput from 'intl-tel-input/reactWithUtils';
import 'intl-tel-input/build/css/intlTelInput.css';
import { useFormContext, Controller } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import it from 'intl-tel-input/i18n/it';

interface PhoneInputProps {
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    orientation?: 'vertical' | 'horizontal';
    className?: string;
    helpText?: string;
}

export function PhoneInput({
    name,
    label,
    placeholder = '312 345 6789',
    required,
    orientation = 'horizontal',
    className,
    helpText,
}: PhoneInputProps) {
    const { control, formState: { errors } } = useFormContext();
    const error = errors[name]?.message as string | undefined;

    const baseInput = (
        <div className="flex-1 w-full">
            <Controller
                name={name}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <IntlTelInput
                        initialValue={value || ''}
                        onChangeNumber={(number) => onChange(number)}
                        initOptions={{
                            initialCountry: 'it',
                            i18n: it,
                            separateDialCode: true,
                            countrySearch: true,
                            formatAsYouType: true,
                            nationalMode: true,
                            containerClass: 'iti--tenant-form',
                        }}
                        inputProps={{
                            id: name,
                            placeholder,
                            className: clsx(
                                "block w-full rounded-md border text-base transition-colors py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50",
                                error
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900"
                                    : "border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                            ),
                        }}
                    />
                )}
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
