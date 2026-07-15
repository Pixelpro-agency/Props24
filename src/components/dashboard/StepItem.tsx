import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Step } from '../../types/onboarding';

interface StepItemProps {
    step: Step;
    onClick?: () => void;
}

export function StepItem({ step, onClick }: StepItemProps) {
    const navigate = useNavigate();

    return (
        <motion.a
            href={step.href}
            onClick={(e) => {
                e.preventDefault();
                if (onClick) {
                    onClick();
                }
                if (step.href) {
                    navigate(step.href);
                }
            }}
            className="flex items-center gap-4 p-4 rounded-lg cursor-pointer border border-transparent transition-colors duration-200 group"
            whileHover={{
                x: 8,
                backgroundColor: 'rgba(255,255,255,1)',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
                borderColor: 'rgba(229,231,235,1)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {/* Cerchio numero */}
            <div
                className={`
                    flex items-center justify-center flex-shrink-0
                    w-12 h-12 rounded-full text-2xl font-bold text-white
                    ${step.completed ? 'bg-green-700' : 'bg-green-600'}
                    transition-transform duration-200
                `}
            >
                {step.completed ? '✓' : step.number}
            </div>

            {/* Contenuto */}
            <div className="min-w-0">
                <h3 className="text-lg font-medium text-gray-800 leading-tight">
                    {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mt-0.5">
                    {step.description}
                </p>
            </div>
        </motion.a>
    );
}
