import { Star } from 'lucide-react';
import { clsx } from 'clsx';

export function PremiumBanner() {
    return (
        <div className="bg-[#fcf8e3] border-b border-[#fbeed5] px-4 py-3 sm:px-6 lg:px-8 mb-4 sm:mb-6 -mx-2 sm:-mx-4 lg:-mx-6 flex flex-col sm:flex-row items-center justify-between text-sm">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <Star className="w-4 h-4 text-orange-400 fill-current" />
                <span className="text-[#8a6d3b] font-medium">
                    Hai bisogno di un abbonamento premium?
                </span>
            </div>
            <a
                href="#inscription"
                className={clsx(
                    "inline-block px-3 py-1 text-xs font-bold leading-none text-white",
                    "bg-[#468847] hover:bg-[#356635] rounded transition-colors whitespace-nowrap"
                )}
            >
                Acquista un abbonamento Premium
            </a>
        </div>
    );
}
