/**
 * Navbar type definitions.
 * Used by navbar components, hooks, and data constants.
 */

import type { LucideIcon } from 'lucide-react';

/* ── Menu Item ────────────────────────────────────────── */

export interface NavbarMenuItem {
    id: string;
    label: string;
    /** Lucide icon component */
    icon?: LucideIcon;
    /** Internal route or external URL */
    href?: string;
    /** Open link in new tab */
    target?: '_blank';
    /** Custom click handler (e.g. open modal) */
    onClick?: () => void;
    /** Hidden when expert mode is off */
    isExpert?: boolean;
    /** Shows a "BETA" super badge */
    isBeta?: boolean;
    /** Renders a visual divider after this item */
    dividerAfter?: boolean;
    /** Badge text (e.g. "BETA", count) */
    badgeText?: string;
    /** Badge color class */
    badgeColor?: 'red' | 'orange' | 'green' | 'yellow';
    /** Icon color override (e.g. green for income, red for expense) */
    iconColor?: string;
}

/* ── Dropdown Section ─────────────────────────────────── */

export interface NavbarDropdownSection {
    /** Section header label */
    header: string;
    /** Items in this section */
    items: NavbarMenuItem[];
}

/* ── Alert ────────────────────────────────────────────── */

export interface NavbarAlert {
    /** Unique ID */
    id: string;
    /** Hash used for dismiss/postpone */
    hash: string;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Icon color class (e.g. 'text-red-500') */
    iconColor: string;
    /** Alert title */
    title: string;
    /** Alert body (supports JSX text) */
    body: string;
    /** Link to view related page */
    viewHref: string;
    /** Whether the alert is currently dismissed */
    dismissed?: boolean;
}

/* ── Search Result ────────────────────────────────────── */

export type SearchResultType =
    | 'property'
    | 'tenant'
    | 'lease'
    | 'contact'
    | 'document'
    | 'finance';

export interface NavbarSearchResult {
    id: string;
    /** Display label */
    label: string;
    /** Result category */
    type: SearchResultType;
    /** Navigation target */
    href: string;
    /** Optional subtitle (e.g. address, email) */
    subtitle?: string;
}
