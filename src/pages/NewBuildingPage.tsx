import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BuildingCreateForm } from '../components/building-form/BuildingCreateForm';

function navigateBackOrBuildings(navigate: ReturnType<typeof useNavigate>) {
    const historyIndex = typeof window !== 'undefined'
        ? (window.history?.state as { idx?: unknown } | null)?.idx
        : undefined;
    if (typeof historyIndex === 'number' && historyIndex > 0) {
        navigate(-1);
        return;
    }
    navigate('/properties/buildings', { replace: true });
}

export function NewBuildingPage() {
    const { account } = useAuth();
    const navigate = useNavigate();
    const [isFormBusy, setIsFormBusy] = useState(true);

    if (!account) return null;

    return (
        <div className="flex min-h-full flex-col">
            <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigateBackOrBuildings(navigate)}
                            disabled={isFormBusy}
                            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100"
                            aria-label="Indietro"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-normal text-gray-800">Nuovo edificio</h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigateBackOrBuildings(navigate)}
                        disabled={isFormBusy}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Annulla
                    </button>
                </div>
            </div>
            <main className="mx-auto w-full max-w-7xl p-6">
                <BuildingCreateForm
                    accountId={account.id}
                    onCreated={(building) => navigate(`/properties/buildings/${building.id}`)}
                    onExitDraft={() => navigateBackOrBuildings(navigate)}
                    onFormBusyChange={setIsFormBusy}
                />
            </main>
        </div>
    );
}
