/* eslint-disable react-refresh/only-export-components -- F2A richiede nello stesso modulo root route, factory e router browser. */
import { useEffect, useState } from 'react';
import {
    Navigate,
    Outlet,
    Route,
    createBrowserRouter,
    createRoutesFromElements,
    useLocation,
} from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { AuthModal } from './components/auth/AuthModal';
import { Layout } from './components/layout/Layout';
import { ContactRepositoryProvider } from './contacts/ContactRepositoryContext';
import { useAuth } from './auth/AuthContext';
import { LogoutPage } from './auth/LogoutPage';
import { BuildingsPage } from './pages/BuildingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentTemplatesPage } from './pages/DocumentTemplatesPage';
import { EditLeasePage } from './pages/EditLeasePage';
import { ImportUnitsPage } from './pages/ImportUnitsPage';
import { LeaseDetailPage } from './pages/LeaseDetailPage';
import { LeasesPage } from './pages/LeasesPage';
import { NewLeasePage } from './landlord/leases/pages/NewLeasePage';
import { NewProperty } from './pages/NewProperty';
import { NewTenantPage } from './pages/NewTenantPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { TenantDetailPage } from './pages/TenantDetailPage';
import { TenantsPage } from './pages/TenantsPage';

interface QueryCacheScope {
    accountId: string | null;
}

function AuthenticatedRootRoute() {
    const location = useLocation();
    const queryClient = useQueryClient();
    const { account, isInitializing } = useAuth();
    const accountId = account?.id ?? null;
    const [readyCacheScope, setReadyCacheScope] =
        useState<QueryCacheScope | null>(null);

    useEffect(() => {
        queryClient.clear();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReadyCacheScope({ accountId });
    }, [accountId, queryClient]);

    const isCacheReady =
        readyCacheScope !== null
        && readyCacheScope.accountId === accountId;

    if (isInitializing || !isCacheReady) return null;

    if (!account) {
        return (
            <>
                {location.pathname === '/logout' ? (
                    <Navigate to="/dashboard" replace />
                ) : null}
                <AuthModal />
            </>
        );
    }

    return (
        <ContactRepositoryProvider accountId={account.id}>
            <Layout>
                <Outlet />
            </Layout>
        </ContactRepositoryProvider>
    );
}

export function createAppRoutes() {
    return createRoutesFromElements(
        <Route element={<AuthenticatedRootRoute />}>
            <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
                path="/properties"
                element={<Navigate to="/properties/units" replace />}
            />
            <Route path="/properties/units" element={<PropertiesPage />} />
            <Route
                path="/properties/units/:id"
                element={<PropertyDetailPage />}
            />
            <Route
                path="/properties/buildings"
                element={<BuildingsPage />}
            />
            <Route path="/properties/new" element={<NewProperty />} />
            <Route
                path="/properties/units/import"
                element={<ImportUnitsPage />}
            />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/new" element={<NewTenantPage />} />
            <Route path="/tenants/:id" element={<TenantDetailPage />} />
            <Route path="/leases" element={<LeasesPage />} />
            <Route path="/leases/new" element={<NewLeasePage />} />
            <Route path="/leases/:id/edit" element={<EditLeasePage />} />
            <Route path="/leases/:id" element={<LeaseDetailPage />} />
            <Route
                path="/documents/all-templates"
                element={<DocumentTemplatesPage />}
            />
            <Route path="/logout" element={<LogoutPage />} />
        </Route>,
    );
}

export const appRouter = createBrowserRouter(createAppRoutes());
