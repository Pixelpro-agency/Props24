import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { PlusCircle } from 'lucide-react';

interface EmptyStateProps {
    onCreateClick?: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Illustration — building with blueprint, coffee, plant */}
            <div className="mb-6">
                <svg width="270" height="180" viewBox="0 0 270 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Main blueprint/document */}
                    <rect x="70" y="20" width="130" height="130" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
                    <rect x="76" y="26" width="118" height="118" rx="2" fill="white" stroke="#e5e7eb" strokeWidth="1" />

                    {/* Building floor plan lines */}
                    <line x1="90" y1="50" x2="180" y2="50" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
                    <line x1="90" y1="62" x2="170" y2="62" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="90" y1="74" x2="175" y2="74" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="90" y1="86" x2="160" y2="86" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="90" y1="98" x2="165" y2="98" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />

                    {/* Floor plan rooms */}
                    <rect x="92" y="108" width="35" height="28" rx="2" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
                    <rect x="132" y="108" width="25" height="28" rx="2" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
                    <rect x="162" y="108" width="20" height="28" rx="2" fill="none" stroke="#9ca3af" strokeWidth="1.5" />

                    {/* Coffee mug */}
                    <ellipse cx="42" cy="140" rx="16" ry="5" fill="#a3e635" opacity="0.3" />
                    <rect x="30" y="118" width="24" height="22" rx="4" fill="#65a30d" opacity="0.8" />
                    <rect x="34" y="122" width="16" height="5" rx="2" fill="#84cc16" opacity="0.6" />
                    <path d="M54 125 C60 125 60 134 54 134" stroke="#65a30d" strokeWidth="2" fill="none" strokeLinecap="round" />
                    {/* Steam */}
                    <path d="M39 115 C39 110 42 110 42 105" stroke="#9ca3af" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
                    <path d="M45 114 C45 109 47 107 47 103" stroke="#9ca3af" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />

                    {/* Plant pot */}
                    <rect x="215" y="125" width="20" height="25" rx="4" fill="#f97316" opacity="0.7" />
                    <ellipse cx="225" cy="125" rx="15" ry="10" fill="#22c55e" opacity="0.6" />
                    <path d="M222 118 C218 106 225 100 225 100" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M228 116 C232 106 238 108 238 108" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M225 120 C225 108 221 102 221 102" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                    {/* Decorative dots and plus signs */}
                    <circle cx="100" cy="12" r="2" fill="#d1d5db" />
                    <circle cx="150" cy="16" r="1.5" fill="#e5e7eb" />
                    <circle cx="50" cy="95" r="1.5" fill="#d1d5db" />
                    <circle cx="218" cy="85" r="2" fill="#e5e7eb" />
                    <text x="115" y="14" fill="#d1d5db" fontSize="12" fontFamily="sans-serif">+</text>
                    <text x="165" y="18" fill="#e5e7eb" fontSize="9" fontFamily="sans-serif">+</text>
                </svg>
            </div>

            {/* Title */}
            <h2 className="text-xl text-gray-700 mb-2">Qui non c'è nulla…</h2>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                Questa sezione ti consente di gestire i tuoi edifici. Inserisci i
                millesimi di ogni proprietà per dividere le spese comuni.
            </p>

            {/* CTA */}
            <Button variant="primary" size="lg" icon={PlusCircle} onClick={onCreateClick}>
                Nuovo edificio
            </Button>
        </motion.div>
    );
}
