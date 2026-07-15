// === BUILDING TYPES ===

export type BuildingStatus = 'active' | 'archived';

export type BuildingSortField = 'BuildingAddress' | 'BuildingSize' | 'BuildingPropertiesCount' | 'BuildingComments';

export interface Building {
    id: string;
    address: string;
    size: number | null;          // m² superficie totale
    unitsCount: number;           // numero unità (appartamenti, garage, ecc.)
    description: string;
    status: BuildingStatus;
}

export interface BuildingFilterState {
    view: BuildingStatus;
    query: string;
    sortField: BuildingSortField;
    sortDirection: 'asc' | 'desc';
    perPage: number;
}
