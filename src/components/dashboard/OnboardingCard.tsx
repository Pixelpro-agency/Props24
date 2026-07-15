import { motion } from 'framer-motion';
import { ProgressBar } from './ProgressBar';
import { StepItem } from './StepItem';
import { HelpFooter } from './HelpFooter';
import type { Step } from '../../types/onboarding';

interface OnboardingCardProps {
    steps: Step[];
    progress: number;
    onStepClick?: (stepNumber: number) => void;
}

export function OnboardingCard({ steps, progress, onStepClick }: OnboardingCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-gray-50 border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm flex flex-col"
        >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Cominciare è semplicissimo...
            </h2>
            
            <ProgressBar progress={progress} />

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mt-6">
                <div className="flex-1 flex flex-col gap-4">
                    {steps.map((step) => (
                        <StepItem 
                            key={step.number} 
                            step={step} 
                            onClick={() => onStepClick?.(step.number)}
                        />
                    ))}
                </div>
            </div>

            <HelpFooter />
        </motion.div>
    );
}
