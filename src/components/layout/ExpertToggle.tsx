import { Switch, Field, Label } from '@headlessui/react';
import { clsx } from 'clsx';

interface ExpertToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

export function ExpertToggle({ enabled, onChange }: ExpertToggleProps) {
    return (
        <div className="px-4 py-3 border-t border-gray-200">
            <Field as="div" className="flex items-center justify-between">
                <Label as="span" className="flex flex-col" passive>
                    <span className="text-sm font-medium text-slate-700">Modalità Esperto</span>
                    <span className="text-[10px] text-gray-500">{enabled ? 'Attiva' : 'Disattiva'}</span>
                </Label>

                <Switch
                    checked={enabled}
                    onChange={onChange}
                    className={clsx(
                        enabled ? 'bg-brand-blue' : 'bg-gray-300',
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-opacity-75'
                    )}
                >
                    <span className="sr-only">Attiva Modalità Esperto</span>
                    <span
                        aria-hidden="true"
                        className={clsx(
                            enabled ? 'translate-x-4' : 'translate-x-0',
                            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out'
                        )}
                    />
                </Switch>
            </Field>
        </div>
    );
}
