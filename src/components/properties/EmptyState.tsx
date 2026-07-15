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
            {/* Illustration */}
            <div className="mb-6">
                <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Document/blueprint */}
                    <rect x="55" y="20" width="90" height="110" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
                    <rect x="60" y="25" width="80" height="100" rx="2" fill="white" stroke="#e5e7eb" strokeWidth="1" />

                    {/* Lines on document */}
                    <line x1="70" y1="45" x2="130" y2="45" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
                    <line x1="70" y1="55" x2="120" y2="55" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="70" y1="65" x2="125" y2="65" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="70" y1="75" x2="110" y2="75" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="70" y1="85" x2="115" y2="85" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />

                    {/* Floor plan element */}
                    <rect x="72" y="95" width="25" height="20" rx="2" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
                    <rect x="102" y="95" width="18" height="20" rx="2" fill="none" stroke="#9ca3af" strokeWidth="1.5" />

                    {/* Coffee cup */}
                    <ellipse cx="40" cy="120" rx="14" ry="5" fill="#a3e635" opacity="0.3" />
                    <rect x="30" y="100" width="20" height="20" rx="3" fill="#65a30d" opacity="0.8" />
                    <rect x="33" y="103" width="14" height="5" rx="2" fill="#84cc16" opacity="0.6" />
                    <path d="M50 107 C55 107 55 115 50 115" stroke="#65a30d" strokeWidth="2" fill="none" strokeLinecap="round" />
                    {/* Steam */}
                    <path d="M37 98 C37 94 40 94 40 90" stroke="#9ca3af" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
                    <path d="M42 97 C42 93 44 91 44 88" stroke="#9ca3af" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />

                    {/* Plant */}
                    <rect x="150" y="110" width="16" height="20" rx="3" fill="#f97316" opacity="0.7" />
                    <ellipse cx="158" cy="110" rx="12" ry="8" fill="#22c55e" opacity="0.6" />
                    <path d="M155 105 C152 95 158 90 158 90" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M160 103 C163 93 168 95 168 95" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M158 107 C158 97 155 92 155 92" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                    {/* Decorative dots */}
                    <circle cx="85" cy="15" r="2" fill="#d1d5db" />
                    <circle cx="110" cy="18" r="1.5" fill="#e5e7eb" />
                    <circle cx="48" cy="85" r="1.5" fill="#d1d5db" />
                    <circle cx="155" cy="75" r="2" fill="#e5e7eb" />
                    {/* Plus signs */}
                    <text x="78" y="12" fill="#d1d5db" fontSize="10" fontFamily="sans-serif">+</text>
                    <text x="120" y="15" fill="#e5e7eb" fontSize="8" fontFamily="sans-serif">+</text>
                </svg>
            </div>

            {/* Title */}
            <h2 className="text-xl text-gray-700 mb-2">Qui non c'è nulla…</h2>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                Questa sezione ti permette di gestire le tue proprietà immobiliari.
            </p>

            {/* CTA */}
            <Button variant="primary" size="lg" icon={PlusCircle} onClick={onCreateClick}>
                Crea una Proprietà
            </Button>
        </motion.div>
    );
}
