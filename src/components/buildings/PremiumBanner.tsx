import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumBannerProps {
    className?: string;
}

export function PremiumBanner({ className = '' }: PremiumBannerProps) {
    return (
        <div
            className={`flex items-center justify-center gap-3 px-5 py-2.5 bg-[#fcf8e3] border-b border-[#fbeed5] ${className}`}
        >
            <Star className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
            <span className="text-sm text-gray-700">
                Hai bisogno di un abbonamento premium?
            </span>
            <motion.a
                href="/landlord/#inscription"
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors duration-150"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
            >
                Acquista un abbonamento Premium
            </motion.a>
        </div>
    );
}
