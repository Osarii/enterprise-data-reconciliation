export type CanonicalField =
  | 'id'
  | 'cliente'
  | 'monto'
  | 'estado';

export interface FieldMapping {
  id: string;
  cliente: string;
  monto: string;
  estado: string;
}

export interface DatasetFieldMappings {
  erp: FieldMapping;
  crm: FieldMapping;
}

export interface MappingValidationResult {
  valid: boolean;
  errors: string[];
}
