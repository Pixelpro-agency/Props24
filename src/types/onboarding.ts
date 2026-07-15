export interface Step {
    number: number;
    title: string;
    description: string;
    href: string;
    completed: boolean;
}

export interface OnboardingState {
    progress: number;
    steps: Step[];
}
