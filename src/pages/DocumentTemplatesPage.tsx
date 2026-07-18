import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Download,
    FileText,
    Search,
} from 'lucide-react';
import {
    DOCUMENT_TEMPLATE_CATEGORIES,
    DOCUMENT_TEMPLATE_COUNT,
    DOCUMENT_TEMPLATES,
} from '../data/documentTemplates';

const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + '/';

function documentTemplateHref(fileName: string): string {
    return (
        baseUrl +
        'document-templates/' +
        encodeURIComponent(fileName)
    );
}

export function DocumentTemplatesPage() {
    const [query, setQuery] = useState('');

    const normalizedQuery = query
        .trim()
        .toLocaleLowerCase('it-IT');

    const visibleSections = useMemo(
        () =>
            DOCUMENT_TEMPLATE_CATEGORIES
                .map((category) => ({
                    ...category,
                    templates: DOCUMENT_TEMPLATES.filter(
                        (template) =>
                            template.category === category.id &&
                            template.title
                                .toLocaleLowerCase('it-IT')
                                .includes(normalizedQuery),
                    ),
                }))
                .filter(
                    (category) =>
                        category.templates.length > 0,
                ),
        [normalizedQuery],
    );

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
            <header>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Modelli di documenti
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    {DOCUMENT_TEMPLATE_COUNT} modelli Word disponibili
                    per il download.
                </p>
            </header>

            <section
                aria-labelledby="document-templates-warning-title"
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
            >
                <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 flex-none text-amber-600"
                />

                <div className="space-y-2">
                    <h2
                        id="document-templates-warning-title"
                        className="font-semibold"
                    >
                        Attenzione!
                    </h2>

                    <p className="text-sm leading-6">
                        I facsimile di lettere e contratti sono
                        disponibili per il download diretto in formato
                        Word.
                    </p>

                    <p className="text-sm leading-6">
                        Props24 non fornisce consulenza legale. Questi
                        modelli sono esempi generali forniti
                        esclusivamente a scopo informativo e potrebbero
                        non essere aggiornati o adatti a ogni situazione.
                        Prima dell’utilizzo verifica la normativa
                        applicabile e, quando necessario, consulta un
                        professionista qualificato. Props24 non assume
                        responsabilità per modifiche, usi impropri o
                        conseguenze derivanti dall’utilizzo dei modelli.
                    </p>
                </div>
            </section>

            <div className="max-w-xl">
                <label
                    htmlFor="document-template-search"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                    Cerca
                </label>

                <div className="relative">
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        id="document-template-search"
                        type="search"
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        placeholder="Cerca un modello"
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                </div>
            </div>

            {visibleSections.length > 0 ? (
                <div className="space-y-10">
                    {visibleSections.map((section) => (
                        <section
                            key={section.id}
                            aria-labelledby={
                                'document-template-category-' +
                                section.id
                            }
                            className="border-t border-gray-200 pt-6"
                        >
                            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                                <h2
                                    id={
                                        'document-template-category-' +
                                        section.id
                                    }
                                    className="text-lg font-semibold text-gray-900"
                                >
                                    {section.title}
                                </h2>

                                <span className="text-sm text-gray-500">
                                    {section.templates.length}{' '}
                                    {section.templates.length === 1
                                        ? 'modello'
                                        : 'modelli'}
                                </span>
                            </div>

                            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {section.templates.map(
                                    (template) => (
                                        <li
                                            key={template.id}
                                            className="flex min-h-40 flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                                                    <FileText
                                                        aria-hidden="true"
                                                        className="h-5 w-5"
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                                        Word
                                                    </span>

                                                    <h3 className="mt-1 text-sm font-medium leading-5 text-gray-900">
                                                        {template.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <a
                                                href={documentTemplateHref(
                                                    template.fileName,
                                                )}
                                                download={
                                                    template.fileName
                                                }
                                                aria-label={
                                                    'Scarica ' +
                                                    template.title
                                                }
                                                className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                            >
                                                <Download
                                                    aria-hidden="true"
                                                    className="h-4 w-4"
                                                />

                                                Scarica
                                            </a>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </section>
                    ))}
                </div>
            ) : (
                <p
                    role="status"
                    className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-600"
                >
                    Nessun modello trovato.
                </p>
            )}
        </div>
    );
}
