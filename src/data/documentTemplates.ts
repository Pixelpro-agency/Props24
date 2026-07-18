export type DocumentTemplateCategory =
    | 'contracts'
    | 'landlords'
    | 'tenants';

export interface DocumentTemplate {
    id: string;
    title: string;
    category: DocumentTemplateCategory;
    fileName: string;
}

export interface DocumentTemplateCategoryConfig {
    id: DocumentTemplateCategory;
    title: string;
}

export const DOCUMENT_TEMPLATE_CATEGORIES: readonly DocumentTemplateCategoryConfig[] = [
    {
        "id": "contracts",
        "title": "Modelli di contratto e di inventario"
    },
    {
        "id": "landlords",
        "title": "Per i proprietari"
    },
    {
        "id": "tenants",
        "title": "Per gli inquilini"
    }
];

export const DOCUMENT_TEMPLATES: readonly DocumentTemplate[] = [
    {
        "id": "residential-flat-tax",
        "title": "Contratto di locazione uso abitativo cedolare secca",
        "category": "contracts",
        "fileName": "Contratto di locazione uso abitativo_cedolare secca.doc"
    },
    {
        "id": "residential",
        "title": "Contratto di locazione uso abitativo",
        "category": "contracts",
        "fileName": "Contratto di locazione uso abitativo.doc"
    },
    {
        "id": "tourist",
        "title": "Contratto di locazione uso turistico",
        "category": "contracts",
        "fileName": "Contratto di locazione uso turistico.doc"
    },
    {
        "id": "garage",
        "title": "Contratto locazione box o garage",
        "category": "contracts",
        "fileName": "Contratto locazione box o garage.doc"
    },
    {
        "id": "agreed-rent-flat-tax",
        "title": "Contratto di locazione a canone concordato con cedolare secca",
        "category": "contracts",
        "fileName": "Contratto locazione canone concordato_cedolare secca.doc"
    },
    {
        "id": "agreed-rent",
        "title": "Contratto di locazione a canone concordato",
        "category": "contracts",
        "fileName": "Contratto locazione canone concordato_mod. de iure.doc"
    },
    {
        "id": "students-flat-tax",
        "title": "Contratto locazione studenti cedolare secca",
        "category": "contracts",
        "fileName": "Contratto locazione studenti_cedolare secca.doc"
    },
    {
        "id": "students",
        "title": "Contratto locazione studenti",
        "category": "contracts",
        "fileName": "Contratto locazione studenti.doc"
    },
    {
        "id": "commercial",
        "title": "Contratto locazione uso commerciale",
        "category": "contracts",
        "fileName": "Contratto locazione uso commerciale.doc"
    },
    {
        "id": "transitional-flat-tax",
        "title": "Contratto locazione uso transitorio cedolare secca",
        "category": "contracts",
        "fileName": "Contratto locazione uso transitorio_cedolare secca.doc"
    },
    {
        "id": "transitional",
        "title": "Contratto locazione uso transitorio",
        "category": "contracts",
        "fileName": "Contratto locazione uso transitorio.doc"
    },
    {
        "id": "preliminary",
        "title": "Contratto preliminare di locazione",
        "category": "contracts",
        "fileName": "Contratto preliminare di locazione.doc"
    },
    {
        "id": "partial-transitional",
        "title": "Contratto locazione parziale transitoria",
        "category": "contracts",
        "fileName": "Contratto locazione parziale transitoria.doc"
    },
    {
        "id": "partial",
        "title": "Contratto locazione parziale",
        "category": "contracts",
        "fileName": "Contratto locazione parziale.doc"
    },
    {
        "id": "partial-sublease",
        "title": "Contratto sublocazione parziale",
        "category": "contracts",
        "fileName": "Contratto sublocazione parziale.doc"
    },
    {
        "id": "loan-for-use",
        "title": "Scrittura privata comodato",
        "category": "contracts",
        "fileName": "Comodato.doc"
    },
    {
        "id": "property-condition-inventory",
        "title": "Verbale stato immobile e inventario",
        "category": "contracts",
        "fileName": "Verbale stato immobile e inventario.doc"
    },
    {
        "id": "istat-rent-update",
        "title": "Aggiornamento canone Istat",
        "category": "landlords",
        "fileName": "Aggiornamento canone Istat.doc"
    },
    {
        "id": "renewal-denial",
        "title": "Diniego rinnovo contratto",
        "category": "landlords",
        "fileName": "Diniego rinnovo contratto.doc"
    },
    {
        "id": "landlord-residential-termination",
        "title": "Disdetta del locatore da contratto di locazione ad uso abitativo",
        "category": "landlords",
        "fileName": "Disdetta del locatore da contratto di locazione ad uso abitativo.doc"
    },
    {
        "id": "renewal-new-conditions",
        "title": "Lettera richiesta rinnovo a nuove condizioni",
        "category": "landlords",
        "fileName": "Lettera richiesta rinnovo a nuove condizioni.doc"
    },
    {
        "id": "formal-demand",
        "title": "Messa in mora",
        "category": "landlords",
        "fileName": "Messa in mora.doc"
    },
    {
        "id": "flat-tax-option",
        "title": "Opzione cedolare secca",
        "category": "landlords",
        "fileName": "Opzione cedolare secca.doc"
    },
    {
        "id": "landlord-access-request",
        "title": "Richiesta accesso locatore",
        "category": "landlords",
        "fileName": "Richiesta accesso locatore.doc"
    },
    {
        "id": "expense-payment-reminder",
        "title": "Sollecito pagamento spese",
        "category": "landlords",
        "fileName": "Sollecito pagamento spese.doc"
    },
    {
        "id": "payment-reminder",
        "title": "Sollecito",
        "category": "landlords",
        "fileName": "Sollecito.doc"
    },
    {
        "id": "subletting-notice",
        "title": "Comunicazione subaffitto",
        "category": "tenants",
        "fileName": "Comunicazione subaffitto.doc"
    },
    {
        "id": "urgent-repairs-warning",
        "title": "Diffida riparazioni urgenti",
        "category": "tenants",
        "fileName": "Diffida proprietario x riparazioni urgenti.doc"
    },
    {
        "id": "tenant-residential-termination",
        "title": "Disdetta del conduttore da contratto di locazione ad uso abitativo",
        "category": "tenants",
        "fileName": "Disdetta del conduttore da contratto di locazione ad uso abitativo.doc"
    },
    {
        "id": "utilities-repair-complaint",
        "title": "Reclamo riparazione utenze",
        "category": "tenants",
        "fileName": "Reclamo riparazione utenze.doc"
    },
    {
        "id": "rent-receipts-request",
        "title": "Richiesta ricevute di affitto",
        "category": "tenants",
        "fileName": "Richiesta ricevute di affitto.doc"
    },
    {
        "id": "urgent-repairs-request",
        "title": "Richiesta riparazioni urgenti",
        "category": "tenants",
        "fileName": "Richiesta riparazioni urgenti.doc"
    }
];

export const DOCUMENT_TEMPLATE_COUNT = DOCUMENT_TEMPLATES.length;
