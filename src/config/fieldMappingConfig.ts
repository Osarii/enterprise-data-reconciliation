import type {
  CanonicalField,
  FieldMapping,
} from '../types/FieldMapping';

export const CANONICAL_FIELDS: CanonicalField[] = [
  'id',
  'cliente',
  'monto',
  'estado',
];

export const DEFAULT_FIELD_MAPPING: FieldMapping = {
  id: 'id',
  cliente: 'cliente',
  monto: 'monto',
  estado: 'estado',
};

export const FIELD_LABELS: Record<CanonicalField, string> = {
  id: 'ID',
  cliente: 'Customer',
  monto: 'Amount',
  estado: 'Status',
};

export const FIELD_DESCRIPTIONS: Record<CanonicalField, string> = {
  id: 'Unique business identifier used to match ERP and CRM records.',
  cliente: 'Customer or account name compared during reconciliation.',
  monto: 'Numeric monetary value. No tolerance is applied.',
  estado: 'Business status validated against the configured status catalog.',
};

export const FIELD_MAPPING_ALIASES: Record<
  CanonicalField,
  string[]
> = {
  id: [
    'id',
    'customer_id',
    'customerid',
    'client_id',
    'clientid',
    'account_id',
    'accountid',
    'account_code',
    'accountcode',
    'codigo',
    'codigo_cliente',
  ],
  cliente: [
    'cliente',
    'customer',
    'customer_name',
    'customername',
    'client_name',
    'clientname',
    'account_name',
    'accountname',
    'display_name',
    'displayname',
    'name',
    'nombre',
  ],
  monto: [
    'monto',
    'amount',
    'balance',
    'amount_due',
    'amountdue',
    'total',
    'value',
    'importe',
    'saldo',
  ],
  estado: [
    'estado',
    'status',
    'lifecycle_status',
    'lifecyclestatus',
    'state',
  ],
};
