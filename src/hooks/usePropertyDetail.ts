import { useState, useEffect, useCallback } from 'react';
import { mockProperties } from '../data/mockProperties';
import { propertyTypes } from '../data/propertyTypes';
import type { Property } from '../types/property';
import type {
    PropertyDetail,
    Note,
    Lease,
    FinancialData,
    Activity,
    MonthlyFinanceData,
} from '../types/propertyDetail';

/* ══════════════════════════════════════════════════════
   Helper: parse "Via Roma 15, Milano" → structured address
   ══════════════════════════════════════════════════════ */
function parseAddress(raw: string) {
    const parts = raw.split(',').map((s) => s.trim());
    const street = parts[0] || raw;
    const city = parts[1] || '';
    return { street, postalCode: '20100', city, country: 'Italia' };
}

function getTypeLabel(type: string): string {
    return propertyTypes.find((pt) => pt.value === type)?.label ?? type;
}

/* ══════════════════════════════════════════════════════
   Generate realistic chart data based on rent amount
   ══════════════════════════════════════════════════════ */
function generateChartData(rent: number): MonthlyFinanceData[] {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    return months.map((month, i) => ({
        month,
        income: rent > 0 ? rent + Math.round((Math.sin(i * 0.5) * rent * 0.05)) : 0,
        expenses: rent > 0 ? Math.round(rent * 0.15 + Math.cos(i * 0.8) * rent * 0.05) : 0,
    }));
}

/* ══════════════════════════════════════════════════════
   Build a full PropertyDetail from a list-level Property
   ══════════════════════════════════════════════════════ */
function buildPropertyDetail(prop: Property): PropertyDetail {
    const address = parseAddress(prop.address);
    const rent = prop.rent ?? 0;
    const surface = prop.surface ?? 0;
    const rooms = prop.rooms ?? 0;
    const bedrooms = Math.max(1, Math.floor(rooms * 0.6));
    const bathrooms = Math.max(1, Math.ceil(rooms * 0.3));
    const utilities = Math.round(rent * 0.1);
    const monthlyIncome = rent;
    const yearlyIncome = monthlyIncome * 12;
    const yearlyExpenses = Math.round(yearlyIncome * 0.15);

    const leases: Lease[] = prop.tenant
        ? [
            {
                id: `lease-${prop.id}`,
                name: prop.title,
                type: 'Contratto 4+4',
                startDate: '2024-01-01',
                endDate: '2028-01-01',
                status: 'active',
                rentAmount: rent,
                utilitiesAmount: utilities,
                tenant: {
                    id: `tenant-${prop.id}`,
                    name: prop.tenant,
                    link: `#/tenants/tenant-${prop.id}`,
                },
            },
        ]
        : [];

    const activities: Activity[] = [];
    if (prop.tenant) {
        activities.push(
            { id: `act-${prop.id}-1`, type: 'payment', description: `Pagamento affitto ${prop.tenant}`, date: '2026-02-01' },
            { id: `act-${prop.id}-2`, type: 'lease', description: `Rinnovo contratto ${prop.tenant}`, date: '2026-01-15' },
        );
    }
    activities.push(
        { id: `act-${prop.id}-3`, type: 'maintenance', description: 'Controllo impianto', date: '2025-12-10' },
        { id: `act-${prop.id}-4`, type: 'general', description: 'Aggiornamento annuncio', date: '2025-11-20' },
    );

    const finances: FinancialData = {
        year: 2026,
        availableYears: [2026, 2025, 2024],
        grossIncome: yearlyIncome,
        expenses: yearlyExpenses,
        netResult: yearlyIncome - yearlyExpenses,
        occupancyRate: prop.tenant ? 100 : 0,
        occupancyDays: prop.tenant ? 365 : 0,
        profitabilityNet: prop.assetValue ? parseFloat(((yearlyIncome - yearlyExpenses) / prop.assetValue * 100).toFixed(2)) : 0,
        purchasePriceKnown: prop.assetValue !== null,
        chartData: generateChartData(rent),
    };

    return {
        id: prop.id,
        title: prop.title,
        type: getTypeLabel(prop.type),
        address,
        specs: {
            surface,
            rooms,
            bedrooms,
            bathrooms,
            floor: 2,
        },
        rent: {
            total: rent + utilities,
            base: rent,
            utilities,
        },
        features: {
            furnished: prop.status === 'affittato',
            smokersAllowed: false,
            petsAllowed: false,
            equipment: surface > 50 ? ['Cucina', 'Lavatrice', 'Aria condizionata'] : [],
        },
        media: {
            photos: [],
            hasStreetView: true,
            coordinates: { lat: 45.4642, lng: 9.19 },
        },
        visibility: {
            isPublic: prop.visibility === 'pubblicato',
            addressPublic: prop.visibility === 'pubblicato',
            phonePublic: false,
        },
        urls: {
            publicProfile: `https://app.rentila.it/property/${prop.id}`,
            icalExport: `https://app.rentila.it/ical/export/${prop.id}`,
            icalImport: `https://app.rentila.it/ical/import/${prop.id}`,
            edit: `/properties/units/${prop.id}/edit`,
            delete: `/properties/units/${prop.id}/delete`,
        },
        tenant: prop.tenant
            ? { id: `tenant-${prop.id}`, name: prop.tenant, link: `#/tenants/tenant-${prop.id}` }
            : undefined,
        leases,
        finances,
        notes: [],
        activities,
    };
}

/* ══════════════════════════════════════════════════════
   Hook
   ══════════════════════════════════════════════════════ */
export function usePropertyDetail(id: string | undefined) {
    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const timer = setTimeout(() => {
            if (!id) {
                setError('ID Unità non fornito');
                setLoading(false);
                return;
            }

            // Find the property in the mock list
            const found = mockProperties.find((p) => p.id === id);
            if (!found) {
                setError(`Unità con ID "${id}" non trovata.`);
                setLoading(false);
                return;
            }

            const detail = buildPropertyDetail(found);
            setProperty(detail);
            setNotes(detail.notes);
            setLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [id]);

    const handleAddNote = useCallback((text: string) => {
        const newNote: Note = {
            id: `new-${Date.now()}`,
            text,
            createdAt: new Date().toISOString(),
        };
        setNotes((prev) => [newNote, ...prev]);
    }, []);

    const handleDeleteNote = useCallback((noteId: string) => {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }, []);

    const handleVisibilityChange = useCallback((field: 'isPublic' | 'addressPublic' | 'phonePublic', value: boolean) => {
        setProperty((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                visibility: { ...prev.visibility, [field]: value },
            };
        });
    }, []);

    return {
        property,
        loading,
        error,
        notes,
        handleAddNote,
        handleDeleteNote,
        handleVisibilityChange,
    };
}
