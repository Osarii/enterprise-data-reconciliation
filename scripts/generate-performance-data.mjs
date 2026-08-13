import {
  mkdir,
  writeFile,
} from 'node:fs/promises';

import {
  join,
} from 'node:path';

const DATASET_SIZES = [
  1_000,
  5_000,
  10_000,
  25_000,
];

const OUTPUT_DIRECTORY = join(
  process.cwd(),
  'sample-data',
  'performance'
);

await mkdir(OUTPUT_DIRECTORY, {
  recursive: true,
});

for (const size of DATASET_SIZES) {
  const { erpRows, crmRows } = buildDatasetPair(size);
  const label = formatSizeLabel(size);

  await Promise.all([
    writeFile(
      join(OUTPUT_DIRECTORY, `performance-${label}-erp.csv`),
      toCsv(erpRows),
      'utf8'
    ),
    writeFile(
      join(OUTPUT_DIRECTORY, `performance-${label}-crm.csv`),
      toCsv(crmRows),
      'utf8'
    ),
  ]);

  console.log(
    `Generated ${label}: ${size.toLocaleString()} ERP rows + ${size.toLocaleString()} CRM rows`
  );
}

console.log(`Performance datasets written to ${OUTPUT_DIRECTORY}`);

function buildDatasetPair(size) {
  const erpRows = [];
  const crmRows = [];
  const onlyCount = Math.max(1, Math.floor(size * 0.01));
  const sharedCount = size - onlyCount;

  for (let index = 1; index <= size; index += 1) {
    const id = `PERF-${String(index).padStart(6, '0')}`;
    const customer = `Customer ${index}`;
    const amount = 1_000 + index * 3;
    const status = index % 3 === 0
      ? 'Pendiente'
      : index % 2 === 0
        ? 'Inactivo'
        : 'Activo';

    erpRows.push({
      id,
      cliente: customer,
      monto: amount,
      estado: status,
    });

    if (index > sharedCount) {
      continue;
    }

    let crmCustomer = customer;
    let crmAmount = amount;
    let crmStatus = status;

    if (index % 100 === 0) {
      crmAmount += 20;
    } else if (index % 50 === 0) {
      crmAmount += 2;
    }

    if (index % 20 === 0) {
      crmCustomer = customer.toUpperCase();
      crmStatus = status.toLowerCase();
    }

    crmRows.push({
      id,
      cliente: crmCustomer,
      monto: crmAmount,
      estado: crmStatus,
    });
  }

  for (let index = 1; index <= onlyCount; index += 1) {
    crmRows.push({
      id: `CRM-ONLY-${String(index).padStart(6, '0')}`,
      cliente: `CRM Only Customer ${index}`,
      monto: 50_000 + index,
      estado: 'Activo',
    });
  }

  return {
    erpRows,
    crmRows,
  };
}

function toCsv(rows) {
  const header = 'id,cliente,monto,estado';
  const body = rows.map((row) =>
    [
      row.id,
      row.cliente,
      row.monto,
      row.estado,
    ]
      .map(escapeCsvValue)
      .join(',')
  );

  return `${header}\n${body.join('\n')}\n`;
}

function escapeCsvValue(value) {
  const text = String(value);

  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function formatSizeLabel(size) {
  if (size % 1_000 === 0) {
    return `${size / 1_000}k`;
  }

  return String(size);
}
