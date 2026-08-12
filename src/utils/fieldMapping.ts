import Papa from 'papaparse';

import {
  CANONICAL_FIELDS,
  DEFAULT_FIELD_MAPPING,
  FIELD_MAPPING_ALIASES,
} from '../config/fieldMappingConfig';

import type {
  FieldMapping,
  MappingValidationResult,
} from '../types/FieldMapping';

export interface CsvHeaderInspection {
  headers: string[];
  suggestedMapping: FieldMapping;
  exactCanonicalMapping: boolean;
}

export function normalizeHeaderName(value: string): string {
  return value.trim().toLowerCase();
}

export function inspectCsvHeaders(
  file: File
): Promise<CsvHeaderInspection> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      preview: 1,
      skipEmptyLines: 'greedy',
      transformHeader: normalizeHeaderName,
      complete: (results) => {
        const headers = Array.from(
          new Set(
            (results.meta.fields ?? [])
              .map(normalizeHeaderName)
              .filter(Boolean)
          )
        );

        const suggestedMapping = suggestFieldMapping(headers);

        resolve({
          headers,
          suggestedMapping,
          exactCanonicalMapping:
            isExactCanonicalMapping(headers, suggestedMapping),
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function suggestFieldMapping(
  headers: string[],
  preferredMapping?: FieldMapping
): FieldMapping {
  const normalizedHeaders = headers.map(normalizeHeaderName);

  const resolved: FieldMapping = {
    ...DEFAULT_FIELD_MAPPING,
  };

  CANONICAL_FIELDS.forEach((field) => {
    const preferredValue = preferredMapping?.[field]
      ? normalizeHeaderName(preferredMapping[field])
      : '';

    if (
      preferredValue &&
      normalizedHeaders.includes(preferredValue)
    ) {
      resolved[field] = preferredValue;
      return;
    }

    const alias = FIELD_MAPPING_ALIASES[field].find((candidate) =>
      normalizedHeaders.includes(normalizeHeaderName(candidate))
    );

    resolved[field] = alias
      ? normalizeHeaderName(alias)
      : '';
  });

  return resolved;
}

export function validateFieldMapping(
  headers: string[],
  mapping: FieldMapping
): MappingValidationResult {
  const normalizedHeaders = new Set(
    headers.map(normalizeHeaderName)
  );

  const errors: string[] = [];
  const selectedHeaders: string[] = [];

  CANONICAL_FIELDS.forEach((field) => {
    const sourceHeader = normalizeHeaderName(mapping[field] ?? '');

    if (!sourceHeader) {
      errors.push(`Select a source column for ${field}.`);
      return;
    }

    if (!normalizedHeaders.has(sourceHeader)) {
      errors.push(
        `Mapped column "${sourceHeader}" for ${field} does not exist in the CSV.`
      );
      return;
    }

    selectedHeaders.push(sourceHeader);
  });

  const duplicates = selectedHeaders.filter(
    (header, index) => selectedHeaders.indexOf(header) !== index
  );

  Array.from(new Set(duplicates)).forEach((header) => {
    errors.push(
      `Source column "${header}" cannot be mapped to more than one canonical field.`
    );
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getMappedSourceHeaders(
  mapping: FieldMapping
): string[] {
  return CANONICAL_FIELDS.map((field) =>
    normalizeHeaderName(mapping[field])
  ).filter(Boolean);
}

export function isDefaultFieldMapping(
  mapping: FieldMapping
): boolean {
  return CANONICAL_FIELDS.every(
    (field) =>
      normalizeHeaderName(mapping[field]) ===
      DEFAULT_FIELD_MAPPING[field]
  );
}

function isExactCanonicalMapping(
  headers: string[],
  mapping: FieldMapping
): boolean {
  const normalizedHeaders = new Set(
    headers.map(normalizeHeaderName)
  );

  return CANONICAL_FIELDS.every(
    (field) =>
      mapping[field] === DEFAULT_FIELD_MAPPING[field] &&
      normalizedHeaders.has(DEFAULT_FIELD_MAPPING[field])
  );
}
