/**
 * Navbar static data — menu items, alerts, help, and settings.
 * Icons use Lucide equivalents of the original Font Awesome Duotone icons.
 */

import {
    Home,
    User,
    Key,
    CalendarRange,
    Sofa,
    ClipboardList,
    Contact2,
    Wrench,
    ClipboardCheck,
    CalendarDays,
    StickyNote,
    FileText,
    MessageSquare,
    UserCheck,
    PlusCircle,
    MinusCircle,
    Sparkles,
    HelpCircle,
    Mail,
    Settings,
    Users,
    UserCog,
    Send,
    Landmark,
    IdCard,
    Lock,
    Coffee,
    Heart,
    CloudDownload,
    Unlock,
    AlertTriangle,
} from 'lucide-react';

import type {
    NavbarMenuItem,
    NavbarDropdownSection,
    NavbarAlert,
} from '../types/navbar';

/* ── Menu "Aggiungi" (16 voci) ────────────────────────── */

export const addMenuItems: NavbarMenuItem[] = [
    {
        id: 'add-property',
        label: 'Nuova proprietà',
        icon: Home,
        href: '/properties/new',
        dividerAfter: true,
    },
    {
        id: 'add-tenant',
        label: 'Nuovo inquilino',
        icon: User,
        href: '/tenants/new',
        dividerAfter: true,
    },
    {
        id: 'add-lease',
        label: 'Nuova locazione',
        icon: Key,
        href: '/leases/new',
        dividerAfter: true,
        isExpert: true,
    },
    {
        id: 'add-reservation',
        label: 'Nuova prenotazione',
        icon: CalendarRange,
        href: '/reservations/new',
        dividerAfter: true,
        isExpert: true,
    },
    {
        id: 'add-catalog',
        label: 'Nuovo catalogo',
        icon: Sofa,
        href: '/catalogs/new',
        dividerAfter: true,
    },
    {
        id: 'add-inventory',
        label: 'Nuovo inventario',
        icon: ClipboardList,
        href: '/inventory/new',
        dividerAfter: true,
    },
    {
        id: 'add-contact',
        label: 'Nuovo contatto',
        icon: Contact2,
        href: '/contacts/new',
        dividerAfter: true,
    },
    {
        id: 'add-maintenance',
        label: 'Nuovo intervento',
        icon: Wrench,
        href: '/maintenance/new',
        dividerAfter: true,
        isExpert: true,
    },
    {
        id: 'add-task',
        label: 'Nuova attività',
        icon: ClipboardCheck,
        href: '/tasks/new',
        dividerAfter: true,
        isExpert: true,
    },
    {
        id: 'add-event',
        label: 'Nuovo evento',
        icon: CalendarDays,
        href: '/agenda/new',
        dividerAfter: true,
    },
    {
        id: 'add-note',
        label: 'Nuova nota',
        icon: StickyNote,
        href: '/notes/new',
        dividerAfter: true,
        isExpert: true,
    },
    {
        id: 'add-document',
        label: 'Nuovo documento',
        icon: FileText,
        href: '/documents/mine/new',
        dividerAfter: true,
    },
    {
        id: 'add-message',
        label: 'Nuovo messaggio',
        icon: MessageSquare,
        href: '/messages/new',
        dividerAfter: true,
    },
    {
        id: 'add-candidate',
        label: 'Nuovo candidato',
        icon: UserCheck,
        href: '/candidates/invite',
        dividerAfter: true,
        isExpert: true,
    },
    {
        id: 'add-income',
        label: 'Nuovo reddito',
        icon: PlusCircle,
        href: '/finances/new-income',
        dividerAfter: true,
        iconColor: 'text-emerald-500',
    },
    {
        id: 'add-expense',
        label: 'Nuova spesa',
        icon: MinusCircle,
        href: '/finances/new-expense',
        dividerAfter: false,
        iconColor: 'text-red-500',
    },
];

/* ── Menu "Aiuto" ─────────────────────────────────────── */

export const helpMenuItems: NavbarMenuItem[] = [
    {
        id: 'help-ai',
        label: 'Assistente AI',
        icon: Sparkles,
        href: '/tools/ai',
        isBeta: true,
        dividerAfter: true,
    },
    {
        id: 'help-support',
        label: 'Centro Supporto',
        icon: HelpCircle,
        href: '/support/',
        target: '_blank',
        dividerAfter: true,
    },
    {
        id: 'help-contact',
        label: 'Contattaci',
        icon: Mail,
        href: '#contact',
        dividerAfter: false,
    },
];

/* ── Menu "Impostazioni / Mio account" ────────────────── */

export const settingsSections: NavbarDropdownSection[] = [
    {
        header: 'Impostazioni',
        items: [
            {
                id: 'settings-general',
                label: 'Impostazioni',
                icon: Settings,
                href: '/settings',
                dividerAfter: true,
            },
            {
                id: 'settings-multi-landlord',
                label: 'Proprietari multipli',
                icon: Users,
                href: '/settings/multi-landlord',
                dividerAfter: true,
            },
            {
                id: 'settings-users',
                label: 'Utenti',
                icon: UserCog,
                href: '/settings/users',
                isBeta: true,
                isExpert: true,
                dividerAfter: true,
            },
            {
                id: 'settings-system-messages',
                label: 'Messaggi di sistema',
                icon: Send,
                href: '/settings/system-messages',
                isBeta: true,
                isExpert: true,
                dividerAfter: true,
            },
            {
                id: 'settings-online-payments',
                label: 'Pagamenti online',
                icon: Landmark,
                href: '/settings/online-payments',
                isExpert: true,
                dividerAfter: true,
            },
        ],
    },
    {
        header: 'Mio account',
        items: [
            {
                id: 'account-profile',
                label: 'Mio account',
                icon: IdCard,
                href: '/profile/edit',
                dividerAfter: true,
            },
            {
                id: 'account-credentials',
                label: 'Email e password',
                icon: Lock,
                href: '/profile/credentials',
                dividerAfter: true,
            },
            {
                id: 'account-subscription',
                label: 'Abbonamento e fatturazione',
                icon: Coffee,
                href: '/profile/subscription',
                dividerAfter: true,
            },
            {
                id: 'account-referrals',
                label: 'Riferimenti',
                icon: Heart,
                href: '/profile/referrals',
                dividerAfter: true,
            },
            {
                id: 'account-export',
                label: 'Scarica base dati',
                icon: CloudDownload,
                href: '/profile/export',
                dividerAfter: true,
            },
            {
                id: 'account-logout',
                label: 'Esci',
                icon: Unlock,
                href: '/logout',
                dividerAfter: false,
            },
        ],
    },
];

/* ── Mock Alerts ──────────────────────────────────────── */

export const mockAlerts: NavbarAlert[] = [
    {
        id: 'alert-late-rent',
        hash: '66bd252cef39951abf112ca782a0df6b',
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        title: 'Canoni in ritardo',
        body: 'Hai <b>1 canone di locazione in ritardo</b>',
        viewHref: '/finances?filter=rent_late',
        dismissed: false,
    },
    {
        id: 'alert-insurance',
        hash: '1a36a71910ffdc607caa81bab81e6b99',
        icon: AlertTriangle,
        iconColor: 'text-yellow-500',
        title: 'Assicurazione inquilino',
        body: 'Hai <b>1 proprietà senza assicurazione inquilino</b>',
        viewHref: '/leases',
        dismissed: false,
    },
];
