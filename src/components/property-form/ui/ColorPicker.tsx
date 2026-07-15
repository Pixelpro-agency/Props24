import { useFormContext, Controller } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
    '#64748b', '#1f2937'
];

interface ColorPickerProps {
    name: string;
    label: string;
    className?: string;
    helpText?: string;
}

export function ColorPicker({ name, label, className, helpText }: ColorPickerProps) {
    const { control, formState: { errors } } = useFormContext();
    const error = errors[name]?.message as string | undefined;

    return (
        <div className={twMerge(clsx("flex flex-col gap-1.5", className))}>
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <Controller
                name={name}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                className={clsx(
                                    "w-8 h-8 rounded-full border-2 transition-transform",
                                    value === color ? "border-gray-900 scale-110 shadow-md" : "border-transparent hover:scale-110"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => onChange(color)}
                                aria-label={`Scegli colore ${color}`}
                            />
                        ))}
                    </div>
                )}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            {helpText && !error && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
        </div>
    );
}
