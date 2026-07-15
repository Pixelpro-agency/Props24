import { useState, useCallback } from 'react';
import type { Step, OnboardingState } from '../types/onboarding';

const DEFAULT_STEPS: Step[] = [
    {
        number: 1,
        title: 'Crea una Proprietà',
        description: 'Crea una scheda sulla tua Proprietà',
        href: '/properties/new',
        completed: false,
    },
    {
        number: 2,
        title: 'Crea un Inquilino',
        description: 'Crea un profilo per il tuo Inquilino',
        href: '/tenants/new',
        completed: false,
    },
    {
        number: 3,
        title: 'Crea una Locazione',
        description: 'Associa la Proprietà e l\'Inquilino con la Locazione',
        href: '/leases/new',
        completed: false,
    },
];

export function useOnboardingProgress(): OnboardingState & {
    markStepComplete: (stepNumber: number) => void;
} {
    const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);

    const completedCount = steps.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    const markStepComplete = useCallback((stepNumber: number) => {
        setSteps((prev) =>
            prev.map((step) =>
                step.number === stepNumber
                    ? { ...step, completed: true }
                    : step
            )
        );
    }, []);

    return { progress, steps, markStepComplete };
}
