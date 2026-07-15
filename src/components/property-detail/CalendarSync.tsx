import { useState } from 'react';
import {
    Calendar,
    Link as LinkIcon,
    Info,
    Copy,
    ExternalLink,
    Check,
} from 'lucide-react';
import type { PropertyDetail } from '../../types/propertyDetail';

interface CalendarSyncProps {
    property: PropertyDetail;
}

function CopyableUrl({ url, label }: { url: string; label: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input
                type="text"
                readOnly
                value={url}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2 cursor-text select-all focus:outline-none focus:ring-1 focus:ring-[#72a333]/30"
                aria-label={label}
            />
            <div className="flex items-center gap-1">
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Copia URL"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                    )}
                </button>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                    title="Apri in nuova scheda"
                >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
            </div>
        </div>
    );
}

export function CalendarSync({ property }: CalendarSyncProps) {
    return (
        <div className="space-y-4">
            {/* ── iCal Export ── */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-1">
                    <LinkIcon className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-800">
                        Calendario delle disponibilità
                    </h3>
                    <div className="relative group">
                        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-56 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                            Esporta il calendario delle disponibilità per sincronizzarlo con altri servizi.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
                        </div>
                    </div>
                </div>

                <CopyableUrl
                    url={property.urls.icalExport}
                    label="URL iCal Export"
                />

                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    Collegamento iCal da utilizzare per la sincronizzazione con servizi esterni come Airbnb e Google Calendar.
                </p>
            </div>

            {/* ── iCal Import ── */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-800">
                        Sincronizzazione del calendario
                    </h3>
                    <div className="relative group">
                        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-56 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                            Importa calendari esterni per aggiornare automaticamente la disponibilità.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
                        </div>
                    </div>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed">
                    Importa gli altri calendari che utilizzi e aggiorneremo automaticamente la disponibilità di questa proprietà.{' '}
                    <a
                        href={property.urls.icalImport ?? '#'}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Clicca qui
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
