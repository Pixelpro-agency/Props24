// utils/calculations.ts

/**
 * Calculates the total monthly rent amount given the rent HC (hors charges) and maintenance charges.
 *
 * @param rentHC - The base rent amount excluding charges
 * @param charges - The maintenance or accessory charges
 * @returns The total monthly amount (rounded to 2 decimal places)
 */
export const recalculateLeaseRent = (rentHC: number, charges: number): number => {
    const total = (Number(rentHC) || 0) + (Number(charges) || 0);
    return Math.round(total * 100) / 100;
};

/**
 * Calculates a human-readable duration string between a start date and an end date.
 *
 * @param startDate - The start string (YYYY-MM-DD)
 * @param endDate - The end string (YYYY-MM-DD)
 * @returns A string representing the duration (e.g., "4 anni e 2 mesi")
 */
export const calculateDuration = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

    if (start > end) return 'Data di fine precedente all\'inizio';

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainMonths = months % 12;

    if (years > 0 && remainMonths > 0) return `${years} anni e ${remainMonths} mesi`;
    if (years > 0) return `${years} anni`;
    if (months > 0) return `${months} mesi`;

    return 'Meno di un mese';
};

/**
 * Proposes an end date based on a start date and a duration in months.
 *
 * @param startDate - The start string (YYYY-MM-DD)
 * @param durationMonths - The duration in months (e.g., 48 for 4 years)
 * @returns The proposed end date as a string (YYYY-MM-DD)
 */
export const proposeEndDate = (startDate: string, durationMonths: number): string => {
    if (!startDate || !durationMonths) return '';
    const start = new Date(startDate);

    if (isNaN(start.getTime())) return '';

    const endProposed = new Date(start);
    endProposed.setMonth(endProposed.getMonth() + durationMonths);

    // Handle edge cases like leap years or end of month correctly
    // (setMonth handles most of this out of the box in JS)

    return endProposed.toISOString().split('T')[0];
};

/**
 * Calculates the pro-rata amount for a partial first month.
 *
 * @param startDate - The start date string (YYYY-MM-DD)
 * @param firstBillEndDate - The end date for the first bill (YYYY-MM-DD)
 * @param rentHC - The full monthly base rent
 * @param charges - The full monthly charges
 * @returns An object containing the calculated pro-rata rentHC and charges
 */
export const calculateFirstPayment = (
    startDate: string,
    firstBillEndDate: string,
    rentHC: number,
    charges: number
): { rent: number; charges: number } | null => {
    if (!startDate || !firstBillEndDate) return null;

    const start = new Date(startDate);
    const end = new Date(firstBillEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    if (end <= start) return null;

    // Number of days in the start month
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

    // Exact number of days between the two dates (inclusive of the end boundary depending on business logic, here we do simple difference)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const proRataRent = ((Number(rentHC) || 0) / daysInMonth) * days;
    const proRataCharges = ((Number(charges) || 0) / daysInMonth) * days;

    return {
        rent: Math.round(proRataRent * 100) / 100,
        charges: Math.round(proRataCharges * 100) / 100
    };
};
