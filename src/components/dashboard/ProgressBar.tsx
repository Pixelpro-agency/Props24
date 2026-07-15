import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="mb-5">
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(progress, 1)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
                I primi passi sono importanti! Il tuo account è quasi pronto{' '}
                <span className="font-semibold text-gray-800">{progress}%</span>
            </p>
        </div>
    );
}
