import {
    Home,
    DoorOpen,
    Bed,
    Bath,
    MapPin,
    Banknote,
} from 'lucide-react';
import type { PropertyDetail } from '../../types/propertyDetail';

interface PropertyInfoCardProps {
    property: PropertyDetail;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + ' €';
}

export function PropertyInfoCard({ property }: PropertyInfoCardProps) {
    const specs = [
        { icon: <Home className="w-4 h-4" />, value: `${property.specs.surface} m²`, label: 'Superficie' },
        { icon: <DoorOpen className="w-4 h-4" />, value: property.specs.rooms, label: 'Vani' },
        { icon: <Bed className="w-4 h-4" />, value: property.specs.bedrooms, label: 'Camere' },
        { icon: <Bath className="w-4 h-4" />, value: property.specs.bathrooms, label: 'Bagni' },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
            {/* Title + Type + Address */}
            <div className="mb-4">
                <h2 className="text-base font-bold text-gray-800 leading-snug">
                    {property.title}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{property.type}</p>
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                        {property.address.street} {property.address.postalCode} {property.address.city}
                    </span>
                </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                {specs.map((spec) => (
                    <div
                        key={spec.label}
                        className="flex items-center gap-2 text-sm text-gray-700"
                    >
                        <span className="text-gray-400">{spec.icon}</span>
                        <span className="font-medium">{spec.value}</span>
                    </div>
                ))}
            </div>

            {/* Pricing Box */}
            <div className="border-2 border-[#72a333]/30 rounded-lg p-4 bg-green-50/30">
                <div className="flex items-start gap-3">
                    <div className="bg-[#72a333]/10 rounded-lg p-2.5 shrink-0">
                        <Banknote className="w-6 h-6 text-[#72a333]" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                            Canone spese incluse
                        </p>
                        <p className="text-2xl font-bold text-[#72a333] leading-tight">
                            {formatCurrency(property.rent.total)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Canone spese escluse {formatCurrency(property.rent.base)}, Spese accessorie {formatCurrency(property.rent.utilities)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
