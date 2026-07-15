import { useFormContext, Controller } from 'react-hook-form';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CheckboxCategory {
    category: string;
    items: { id: string; label: string }[];
}

interface CheckboxGridProps {
    name: string;
    categories: CheckboxCategory[];
    className?: string;
}

export function CheckboxGrid({ name, categories, className }: CheckboxGridProps) {
    const { control } = useFormContext();

    return (
        <div className={twMerge(clsx("flex flex-col gap-6", className))}>
            <Controller
                name={name}
                control={control}
                defaultValue={[]} // Expect an array of selected IDs
                render={({ field: { onChange, value } }) => {
                    const selectedValues = Array.isArray(value) ? value : [];

                    const toggleCheckbox = (id: string, checked: boolean) => {
                        if (checked) {
                            onChange([...selectedValues, id]);
                        } else {
                            onChange(selectedValues.filter(val => val !== id));
                        }
                    };

                    return (
                        <>
                            {categories.map((cat) => (
                                <div key={cat.category} className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                                    <h5 className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-0.5 text-right">
                                        {cat.category}
                                    </h5>

                                    <div className="flex-1 max-w-[500px]">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                            {cat.items.map((item) => {
                                                const isChecked = selectedValues.includes(item.id);
                                                return (
                                                    <label key={item.id} className="flex items-start gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => toggleCheckbox(item.id, e.target.checked)}
                                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600 cursor-pointer transition-colors"
                                                        />
                                                        <span className={clsx("text-[13px] transition-colors leading-tight", isChecked ? "text-gray-900 font-medium" : "text-gray-600 group-hover:text-gray-900")}>
                                                            {item.label}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    );
                }}
            />
        </div>
    );
}
