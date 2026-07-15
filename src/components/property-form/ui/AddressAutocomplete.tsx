import { useFormContext } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AddressAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name: string;
    label: string;
    helpText?: string;
    required?: boolean;
}

export function AddressAutocomplete({ name, label, helpText, required, className, ...props }: AddressAutocompleteProps) {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[name]?.message as string | undefined;

    // Nota: L'integrazione reale con Google Places verrebbe posizionata qui, 
    // agganciando ref dell'input al servizio di autocompletamento e usando setValue() 
    // di react-hook-form per aggiornare i campi dell'indirizzo al momento della selezione.

    return (
        <div className={twMerge(clsx("flex flex-col gap-1.5", className))}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="h-5 w-5" />
                </div>
                <input
                    id={name}
                    {...register(name)}
                    className={clsx(
                        "block w-full rounded-md border text-base transition-colors py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-opacity-50 pac-target-input",
                        error
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900 placeholder-red-300"
                            : "border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            {helpText && !error && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
        </div>
    );
}
