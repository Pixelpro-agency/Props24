import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArrowLeft, MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { TenantActionOperation } from '../tenants/TenantActionModal';

interface TenantDetailHeaderProps {
    title: string;
    tenantId: string;
    archived: boolean;
    onRequestAction: (operation: TenantActionOperation) => void;
}

export function TenantDetailHeader({ title, tenantId, archived, onRequestAction }: TenantDetailHeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <Link
                    to="/tenants"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Torna agli inquilini"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-col">
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">
                        {title}
                    </h1>
                    {archived && <span className="mt-1 inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium">Archiviato</span>}
                </div>
            </div>
            <div className="relative">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Azioni"
                >
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
                {menuOpen && (
                    <>
                        {/* Overlay per chiudere il menu */}
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        {/* Dropdown menu */}
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                            <Link to={`/tenants/${tenantId}/edit`} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Pencil className="w-4 h-4" /> Modifica
                            </Link>
                            <button onClick={() => { setMenuOpen(false); onRequestAction(archived ? 'restore' : 'archive'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                {archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}{archived ? 'Ripristina' : 'Archivia'}
                            </button>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onRequestAction('delete');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Elimina
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
