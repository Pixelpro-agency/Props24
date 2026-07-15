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
            {/* Illustration — Tenant/Person icon */}
            <div className="mb-6">
                <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Head */}
                    <circle cx="100" cy="50" r="25" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
                    <circle cx="100" cy="47" r="12" fill="#e5e7eb" />
                    {/* Body silhouette */}
                    <path d="M60 120 C60 90 80 75 100 75 C120 75 140 90 140 120" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
                    {/* Magnifying glass */}
                    <circle cx="145" cy="55" r="14" fill="none" stroke="#9ca3af" strokeWidth="2" />
                    <line x1="155" y1="65" x2="165" y2="75" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Question mark */}
                    <text x="141" y="60" fill="#9ca3af" fontSize="16" fontFamily="sans-serif" fontWeight="bold">?</text>
                    {/* Decorative dots */}
                    <circle cx="50" cy="85" r="2" fill="#d1d5db" />
                    <circle cx="155" cy="95" r="1.5" fill="#e5e7eb" />
                    <circle cx="70" cy="130" r="1.5" fill="#d1d5db" />
                </svg>
            </div>

            {/* Title */}
            <h2 className="text-xl text-gray-700 mb-2">Qui non c'è nulla…</h2>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                Qui puoi gestire i locatari. Puoi invitarli ad iscriversi al sito e dare loro accesso alla sezione al loro dedicata.
            </p>

            {/* CTA */}
            <Button variant="primary" size="lg" icon={PlusCircle} onClick={onCreateClick}>
                Crea un Inquilino
            </Button>
        </motion.div>
    );
}
