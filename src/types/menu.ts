import type { LucideIcon } from 'lucide-react';

export type BadgeType = 'orange' | 'red' | null;

/** Badge singolo con id, tooltip e visibilità condizionale */
export interface BadgeItem {
    id: string;
    class: BadgeType;
    count: number;
    tooltip?: string;
    hidden?: boolean;
}

/** Azione quick-add con icona e tooltip personalizzati */
export interface QuickAddAction {
    icon: LucideIcon;
    href: string;
    tooltip: string;
}

export interface MenuItem {
    id: string;
    label: string;
    icon?: LucideIcon;
    href?: string;
    children?: MenuItem[];

    /** @deprecated Usa `badges` per supporto multiplo */
    badge?: {
        type: BadgeType;
        count?: number;
    };
    /** Array di badge multipli (orange/red con tooltip e hidden) */
    badges?: BadgeItem[];

    isBeta?: boolean;
    isExpert?: boolean;

    quickAdd?: boolean;
    quickAddHref?: string;
    /** Array di azioni quick-add multiple (es. Finanze: Nuova spesa + Nuovo reddito) */
    quickAddActions?: QuickAddAction[];

    /** Mostra icona "⋯" su hover per azioni aggiuntive */
    ellipsis?: boolean;
}

export interface MenuGroup {
    title: string;
    items: MenuItem[];
}
