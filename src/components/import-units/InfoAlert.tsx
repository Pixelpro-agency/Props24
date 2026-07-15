import { useState } from 'react';
import { Info, X, FileSpreadsheet, FileText, Sheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateLink {
    label: string;
    href: string;
    format: string;
}

const TEMPLATE_LINKS: TemplateLink[] = [
    {
        label: 'Modello di documento Excel',
        href: '#',
        format: 'xlsx',
    },
    {
        label: 'Modello di documento Open Office',
        href: '#',
        format: 'ods',
    },
    {
        label: 'Modello di documento CSV',
        href: '#',
        format: 'csv',
    },
];

function FormatIcon({ format }: { format: string }) {
    switch (format) {
        case 'xlsx':
            return <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />;
        case 'ods':
            return <Sheet className="w-4 h-4 text-blue-600 flex-shrink-0" />;
        case 'csv':
            return <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />;
        default:
            return <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    }
}

export function InfoAlert() {
    const [visible, setVisible] = useState(true);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6"
                >
                    <button
                        onClick={() => setVisible(false)}
                        className="absolute right-3 top-3 p-1 text-blue-300 hover:text-blue-500 transition-colors"
                        aria-label="Chiudi informazione"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-blue-800 mb-1">
                                Informazione
                            </h3>
                            <p className="text-sm text-blue-700 mb-3">
                                È possibile importare un file in formato CSV, Excel o Open Office.
                                Utilizzare i seguenti modelli per importare:
                            </p>
                            <ul className="space-y-2">
                                {TEMPLATE_LINKS.map((link) => (
                                    <li key={link.format}>
                                        <a
                                            href={link.href}
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150"
                                        >
                                            <FormatIcon format={link.format} />
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
