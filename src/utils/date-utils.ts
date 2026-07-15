/**
 * Utility to parse a DD/MM/YYYY date string into a JS Date object.
 */
export function parseDate(str: string): Date | null {
    if (!str) return null;

    // Handle DD/MM/YYYY format
    const parts = str.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return isNaN(d.getTime()) ? null : d;
    }

    // Fallback: try native Date parsing (e.g. ISO format)
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}
