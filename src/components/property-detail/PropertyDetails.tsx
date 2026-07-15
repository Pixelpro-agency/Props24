import {
    X,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PropertyDetail } from '../../types/propertyDetail';

interface PropertyDetailsProps {
    property: PropertyDetail;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + ' €';
}

/* ── Toggle indicator (disabled = faded + red X) ── */
function FeatureToggle({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <div className={clsx(
            'flex items-center gap-2 text-sm',
            enabled ? 'text-gray-700' : 'text-gray-400 opacity-50',
        )}>
            {!enabled && <X className="w-4 h-4 text-red-500 shrink-0" />}
            <span>{label}</span>
        </div>
    );
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-6">
            {/* ── Row 1: Indirizzo | Descrizione ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Indirizzo */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        Indirizzo
                    </h3>
                    <dl className="space-y-1.5 text-sm text-gray-600">
                        <dd>{property.address.street}</dd>
                        <dd>{property.address.postalCode} {property.address.city}</dd>
                        <dd>{property.address.country}</dd>
                    </dl>
                </div>

                {/* Descrizione */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        Descrizione
                    </h3>
                    <dl className="space-y-1.5 text-sm text-gray-600">
                        <dd>Superficie <span className="font-medium text-gray-800">{property.specs.surface} m²</span></dd>
                        <dd>Vani <span className="font-medium text-gray-800">{property.specs.rooms}</span></dd>
                        <dd>Camere da letto <span className="font-medium text-gray-800">{property.specs.bedrooms}</span></dd>
                        <dd>Bagni <span className="font-medium text-gray-800">{property.specs.bathrooms}</span></dd>
                        <dd>Piano <span className="font-medium text-gray-800">{property.specs.floor}</span></dd>
                    </dl>
                </div>
            </div>

            {/* ── Row 2: Attrezzature | Informazioni aggiuntive ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Attrezzature */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        Attrezzature
                    </h3>
                    {property.features.equipment.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {property.features.equipment.map((item) => (
                                <span
                                    key={item}
                                    className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Nessuna attrezzatura</p>
                    )}
                </div>

                {/* Informazioni aggiuntive */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        Informazioni aggiuntive
                    </h3>
                    <div className="space-y-2">
                        <FeatureToggle label="Ammobiliato" enabled={property.features.furnished} />
                        <FeatureToggle label="Fumatori accettati" enabled={property.features.smokersAllowed} />
                        <FeatureToggle label="Animali accettati" enabled={property.features.petsAllowed} />
                    </div>
                </div>
            </div>

            {/* ── Row 3: Affitto | Informazioni finanziarie ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Affitto */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        Affitto
                    </h3>
                    <dl className="space-y-1.5 text-sm text-gray-600">
                        <dd>
                            Canone spese incluse{' '}
                            <span className="font-medium text-[#72a333]">{formatCurrency(property.rent.total)}</span>
                        </dd>
                        <dd>
                            Spese accessorie{' '}
                            <span className="font-medium text-gray-800">{formatCurrency(property.rent.utilities)}</span>
                        </dd>
                    </dl>
                </div>

                {/* Informazioni finanziarie */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        Informazioni finanziarie
                    </h3>
                    <p className="text-sm text-gray-400 italic">Nessuna informazione aggiuntiva</p>
                </div>
            </div>
        </div>
    );
}
