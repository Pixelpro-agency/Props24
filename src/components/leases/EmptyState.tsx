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
            {/* Illustration — Lease/Contract/Keys icon */}
            <div className="mb-6">
                <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background Document */}
                    <rect x="55" y="20" width="90" height="110" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
                    <rect x="60" y="25" width="80" height="100" rx="2" fill="white" stroke="#e5e7eb" strokeWidth="1" />

                    {/* Document Lines */}
                    <line x1="70" y1="45" x2="130" y2="45" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
                    <line x1="70" y1="55" x2="110" y2="55" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="70" y1="65" x2="120" y2="65" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="70" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />

                    {/* Checkmark Stamp */}
                    <circle cx="120" cy="95" r="14" fill="#dcfce7" opacity="0.6" />
                    <path d="M115 95 L118 99 L126 91" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* House Icon */}
                    <path d="M30 110 L50 90 L70 110" stroke="#9ca3af" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M35 105 V125 H65 V105" stroke="#9ca3af" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="45" y="115" width="10" height="10" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />

                    {/* Keys floating */}
                    <circle cx="150" cy="110" r="8" fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <path d="M145 115 L130 130" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    <line x1="135" y1="125" x2="132" y2="128" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    <line x1="138" y1="122" x2="135" y2="125" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />

                    {/* Decorative dots */}
                    <circle cx="85" cy="15" r="2" fill="#d1d5db" />
                    <circle cx="155" cy="75" r="2" fill="#e5e7eb" />
                    <circle cx="48" cy="75" r="1.5" fill="#d1d5db" />
                </svg>
            </div>

            {/* Title */}
            <h2 className="text-xl text-gray-700 mb-2 font-semibold">Qui non c'è nulla…</h2>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-8 text-center max-w-lg leading-relaxed">
                Qui puoi gestire le locazioni. Se possiedi più di 5 proprietà affittare a 5 inquilini diversi, dovrari creare 5 contratti di locazione. Per ogni contratto di locazione, i canoni e le ricevute sono generate automaticamente nella sezione Finanze.
            </p>

            {/* CTA */}
            <Button variant="primary" size="lg" icon={PlusCircle} onClick={onCreateClick}>
                Nuova locazione
            </Button>
        </motion.div>
    );
}
