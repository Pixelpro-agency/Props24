export { propertyTypeCatalog as propertyTypes } from './propertyCatalogs';
export type { PropertyType } from './propertyCatalogs';
export type PropertyTypeOption = typeof import('./propertyCatalogs').propertyTypeCatalog[number];
