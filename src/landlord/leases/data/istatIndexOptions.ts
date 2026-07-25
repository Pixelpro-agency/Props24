export interface IstatIndexOption {
    value: string;
    label: string;
    rate: number;
    year: number;
    month: number;
}

// TODO: sostituire questo snapshot locale con dati ISTAT aggiornati
// tramite backend/API, mantenendo versionati i valori già usati nei contratti.
export const ISTAT_INDEX_OPTIONS: readonly IstatIndexOption[] = [
    { value: '2.9|2026|6', label: 'giu, 2026, 2.9', rate: 2.9, year: 2026, month: 6 },
    { value: '3|2026|5', label: 'mag, 2026, 3', rate: 3, year: 2026, month: 5 },
    { value: '2.6|2026|4', label: 'apr, 2026, 2.6', rate: 2.6, year: 2026, month: 4 },
    { value: '1.5|2026|3', label: 'mar, 2026, 1.5', rate: 1.5, year: 2026, month: 3 },
    { value: '1.1|2026|2', label: 'feb, 2026, 1.1', rate: 1.1, year: 2026, month: 2 },
    { value: '0.8|2026|1', label: 'gen, 2026, 0.8', rate: 0.8, year: 2026, month: 1 },
    { value: '1.1|2025|12', label: 'dic, 2025, 1.1', rate: 1.1, year: 2025, month: 12 },
    { value: '-0.1|2025|11', label: 'nov, 2025, -0.1', rate: -0.1, year: 2025, month: 11 },
    { value: '1.1|2025|10', label: 'ott, 2025, 1.1', rate: 1.1, year: 2025, month: 10 },
    { value: '1.4|2025|9', label: 'set, 2025, 1.4', rate: 1.4, year: 2025, month: 9 },
    { value: '1.4|2025|8', label: 'ago, 2025, 1.4', rate: 1.4, year: 2025, month: 8 },
    { value: '1.5|2025|7', label: 'lug, 2025, 1.5', rate: 1.5, year: 2025, month: 7 },
    { value: '1.5|2025|6', label: 'giu, 2025, 1.5', rate: 1.5, year: 2025, month: 6 },
    { value: '1.4|2025|5', label: 'mag, 2025, 1.4', rate: 1.4, year: 2025, month: 5 },
    { value: '1.7|2025|4', label: 'apr, 2025, 1.7', rate: 1.7, year: 2025, month: 4 },
    { value: '1.7|2025|3', label: 'mar, 2025, 1.7', rate: 1.7, year: 2025, month: 3 },
    { value: '1.5|2025|2', label: 'feb, 2025, 1.5', rate: 1.5, year: 2025, month: 2 },
    { value: '1.3|2025|1', label: 'gen, 2025, 1.3', rate: 1.3, year: 2025, month: 1 },
];
