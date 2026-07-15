import { useFormContext, Controller } from 'react-hook-form';
import { Switch } from '@headlessui/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ToggleSwitchProps {
    name: string;
    label: string;
    description?: string;
    sideText?: React.ReactNode;
    helpText?: React.ReactNode;
    className?: string;
}

export function ToggleSwitch({ name, label, description, sideText, helpText, className }: ToggleSwitchProps) {
    const { control } = useFormContext();

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => (
                <div className={twMerge(clsx("grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-center gap-4", className))}>
                    <div className="text-right">
                        <span className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-0.5">
                            {label}
                        </span>
                        {description && (
                            <span className="block text-xs text-gray-400 mt-1">{description}</span>
                        )}
                    </div>

                    <div className="flex-1 max-w-[500px]">
                        <div className="flex items-center gap-3">
                            <Switch
                                checked={!!value}
                                onChange={onChange}
                                className={clsx(
                                    !!value ? 'bg-green-600' : 'bg-red-500',
                                    'relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2'
                                )}
                            >
                                <span className="sr-only">Toggle {label}</span>
                                <span
                                    className={clsx(
                                        !!value ? 'translate-x-7' : 'translate-x-0',
                                        'pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            !!value ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in',
                                            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
                                        )}
                                        aria-hidden="true"
                                    >
                                        <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </span>
                                    <span
                                        className={clsx(
                                            !!value ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out',
                                            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
                                        )}
                                        aria-hidden="true"
                                    >
                                        <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </span>
                                </span>
                            </Switch>
                            {sideText && <div className="text-sm font-medium text-gray-700">{sideText}</div>}
                        </div>
                        {helpText && <div className="mt-3 text-sm text-gray-500">{helpText}</div>}
                    </div>
                </div>
            )}
        />
    );
}
