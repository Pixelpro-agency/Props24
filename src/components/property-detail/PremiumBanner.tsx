import { Star } from 'lucide-react';

export function PremiumBanner() {
    return (
        <div className="bg-[#fcf8e3] border-b-2 border-orange-400 px-4 py-2.5 flex items-center justify-center gap-3 text-sm flex-wrap">
            <Star className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
            <span className="text-gray-700">Hai bisogno di un abbonamento premium?</span>
            <button className="bg-[#72a333] hover:bg-[#638f2b] text-white text-xs font-semibold uppercase px-4 py-1.5 rounded transition-colors duration-200 cursor-pointer">
                Acquista un abbonamento Premium
            </button>
        </div>
    );
}
