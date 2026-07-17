const KNOWN_ROUTES = [
    '/',
    '/dashboard',
    '/properties',
    '/properties/units',
    '/properties/buildings',
    '/properties/new',
    '/properties/units/import',
    '/tenants',
    '/tenants/new',
    '/leases',
    '/leases/new',
];

const DYNAMIC_ROUTE_PATTERNS = [
    /^\/properties\/units\/[^/]+$/,
    /^\/tenants\/[^/]+$/,
    /^\/leases\/[^/]+$/,
    /^\/leases\/[^/]+\/edit$/,
];

export function isKnownRoute(href?: string): boolean {
    if (!href || href.startsWith('#')) return false;

    const path = href.split(/[?#]/)[0];

    return KNOWN_ROUTES.includes(path) || DYNAMIC_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}
