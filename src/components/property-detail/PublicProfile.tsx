import { useState } from 'react';
import {
    Link as LinkIcon,
    Info,
    Copy,
    ExternalLink,
    Check,
    EyeOff,
    Eye,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PropertyDetail } from '../../types/propertyDetail';

interface PublicProfileProps {
    property: PropertyDetail;
    onVisibilityChange?: (field: 'isPublic' | 'addressPublic' | 'phonePublic', value: boolean) => void;
}

/* ── Toggle switch styled component ── */
function PrivacyToggle({
    label,
    enabled,
    onChange,
}: {
    label: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-3 py-1.5">
            {/* Switch */}
            <button
                onClick={() => onChange(!enabled)}
                className={clsx(
                    'relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer shrink-0',
                    enabled ? 'bg-[#72a333]' : 'bg-gray-300',
                )}
                role="switch"
                aria-checked={enabled}
                aria-label={label}
            >
                <span
                    className={clsx(
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                        enabled ? 'translate-x-5' : 'translate-x-0.5',
                    )}
                />
            </button>

            {/* Status indicator */}
            {!enabled && (
                <span className="bg-red-500 text-white rounded p-0.5">
                    <EyeOff className="w-3 h-3" />
                </span>
            )}
            {enabled && (
                <span className="bg-green-500 text-white rounded p-0.5">
                    <Eye className="w-3 h-3" />
                </span>
            )}

            {/* Label */}
            <span className="text-sm text-gray-600">
                {label} è{' '}
                <span className="font-semibold">
                    {enabled ? 'Pubblica' : 'Privata'}
                </span>
                {' '}
                {!enabled && <EyeOff className="w-3.5 h-3.5 inline text-gray-400" />}
            </span>
        </div>
    );
}

export function PublicProfile({ property, onVisibilityChange }: PublicProfileProps) {
    const [visibility, setVisibility] = useState(property.visibility);
    const [copied, setCopied] = useState(false);

    function handleChange(field: 'isPublic' | 'addressPublic' | 'phonePublic', value: boolean) {
        setVisibility((prev) => ({ ...prev, [field]: value }));
        onVisibilityChange?.(field, value);
    }

    function handleCopy() {
        navigator.clipboard.writeText(property.urls.publicProfile).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-800">
                    Profilo pubblico
                </h3>
                <div className="relative group">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-56 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                        Configura la visibilità pubblica della tua proprietà.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
                    </div>
                </div>
            </div>

            {/* URL field */}
            <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                    type="text"
                    readOnly
                    value={property.urls.publicProfile}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2 cursor-text select-all focus:outline-none focus:ring-1 focus:ring-[#72a333]/30"
                    aria-label="URL profilo pubblico"
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
                        href={property.urls.publicProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Apri profilo"
                    >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                </div>
            </div>

            {/* Privacy Toggles */}
            <div className="space-y-1 border-t border-gray-100 pt-3">
                <PrivacyToggle
                    label="La proprietà"
                    enabled={visibility.isPublic}
                    onChange={(v) => handleChange('isPublic', v)}
                />
                <PrivacyToggle
                    label="L'indirizzo dell'immobile"
                    enabled={visibility.addressPublic}
                    onChange={(v) => handleChange('addressPublic', v)}
                />
                <PrivacyToggle
                    label="Il numero di telefono"
                    enabled={visibility.phonePublic}
                    onChange={(v) => handleChange('phonePublic', v)}
                />
            </div>

            {/* Footer text */}
            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                Attiva il foyer elettronico se stai cercando un inquilino. I candidati potranno rispondere al tuo annuncio direttamente dal nostro sito.
            </p>
        </div>
    );
}
