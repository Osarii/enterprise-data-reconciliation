# Enterprise Data Reconciliation Platform

![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript\&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite\&logoColor=white)
![Material UI](https://img.shields.io/badge/Material_UI-UI-007FFF?logo=mui\&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active_Development-orange)
![Version](https://img.shields.io/badge/Version-v0.1.6-blue)

A modern enterprise-oriented data reconciliation platform designed to compare ERP and CRM datasets, detect inconsistencies, evaluate data quality, manage exceptions, analyze reconciliation performance, and generate executive reports.

The project focuses on solving a common enterprise problem:

> **How can organizations reliably detect discrepancies between business systems that are expected to contain equivalent information?**

---

## Overview

Enterprise systems frequently store overlapping information across platforms such as:

* ERP systems
* CRM platforms
* Financial systems
* Billing platforms
* Customer databases
* Operational systems

Over time, these systems may become inconsistent because of:

* manual data entry
* synchronization failures
* duplicated records
* inconsistent formatting
* invalid values
* missing records
* integration errors
* schema differences between systems

**Enterprise Data Reconciliation Platform** provides a frontend workflow for importing two datasets, validating their quality, normalizing comparable information, reconciling records, reviewing exceptions, and generating analytical reports.

---

## Current Version

### `v0.1.6 — Configurable Field Mapping + History Analytics`

The current development version includes:

* configurable source-to-canonical field mapping
* ERP and CRM CSV imports
* schema validation
* advanced data quality analysis
* duplicate detection
* configurable status validation
* suspicious ID detection
* normalization engine
* exact matches
* normalized matches
* differences
* ERP-only records
* CRM-only records
* exception review workflow
* executive dashboard
* reconciliation reports
* reconciliation history
* historical analytics
* charts and metrics
* CSV exports
* PDF exports
* dark mode
* browser persistence

The application currently operates entirely on the frontend.

A backend architecture using **NestJS, PostgreSQL and Prisma** is planned for a future version.

---

# Key Features

## CSV Import

ERP and CRM datasets can be independently imported using CSV files.

The import pipeline includes:

* CSV parsing with PapaParse
* structural validation
* required field validation
* duplicate detection
* value validation
* data quality analysis
* configurable field mapping

---

## Configurable Field Mapping

Source systems do not need to use identical column names.

For example, an ERP dataset may contain:

```text
customer_id
customer_name
balance
status
```

while a CRM dataset may contain:

```text
account_code
display_name
amount_due
lifecycle_status
```

Both can be mapped to the application's canonical schema:

```text
id
cliente
monto
estado
```

Example:

```text
ERP

customer_id     → id
customer_name   → cliente
balance         → monto
status          → estado
```

```text
CRM

account_code       → id
display_name       → cliente
amount_due         → monto
lifecycle_status   → estado
```

The reconciliation engine therefore remains independent from source-specific schemas.

---

# Reconciliation Architecture

```mermaid
flowchart TD
    ERP[ERP CSV] --> FM[Field Mapping]
    CRM[CRM CSV] --> FM

    FM --> CSV[CSV Parsing]
    CSV --> VALIDATION[Advanced Validation]
    VALIDATION --> QUALITY[Data Quality Analysis]
    QUALITY --> NORMALIZATION[Normalization Engine]
    NORMALIZATION --> RECONCILIATION[Reconciliation Engine]

    RECONCILIATION --> EXACT[Exact Match]
    RECONCILIATION --> NORMALIZED[Normalized Match]
    RECONCILIATION --> DIFFERENCE[Difference]
    RECONCILIATION --> ERPONLY[Only ERP]
    RECONCILIATION --> CRMONLY[Only CRM]

    EXACT --> DASHBOARD[Dashboard & Reports]
    NORMALIZED --> DASHBOARD
    DIFFERENCE --> EXCEPTIONS[Exceptions Workflow]
    ERPONLY --> EXCEPTIONS
    CRMONLY --> EXCEPTIONS

    EXCEPTIONS --> REPORTS[Reports]
    DASHBOARD --> REPORTS

    REPORTS --> HISTORY[Reconciliation History]
    HISTORY --> EXPORT[CSV / PDF Export]
```

---

# Canonical Data Model

The current canonical reconciliation model uses four fields:

| Field     | Description                |
| --------- | -------------------------- |
| `id`      | Unique business identifier |
| `cliente` | Customer or entity name    |
| `monto`   | Monetary value             |
| `estado`  | Business status            |

Future versions are planned to allow fully configurable schemas.

---

# Advanced Validation

The validation engine classifies data quality problems into structured issues.

Each issue can contain information such as:

```ts
type
severity
message
row
field
value
relatedRows
```

---

## Issue Categories

Current categories include:

* Missing Value
* Invalid Amount
* Negative Amount
* Duplicate ID
* Invalid Status
* Suspicious ID
* Unexpected Column
* Missing Column
* CSV Parse Error
* Empty File

---

## Severity Levels

Issues are classified as:

### BLOCKING

Blocking issues prevent reconciliation.

Examples:

* duplicate IDs
* missing required values
* invalid amounts
* negative amounts
* invalid required columns
* invalid status
* CSV parsing failures

### WARNING

Warnings indicate suspicious information but do not prevent reconciliation.

Examples:

* suspicious IDs
* unexpected columns

This prevents potentially legitimate enterprise identifiers from being rejected unnecessarily.

---

# Duplicate Detection

Duplicate IDs are treated as blocking problems because a reconciliation identifier must uniquely represent a record.

The platform reports:

* duplicated identifier
* number of duplicates
* exact CSV rows where the duplicate appears

Example:

```text
Duplicate ID: DUP-001

Rows:
3, 4
```

---

# Suspicious ID Detection

Enterprise identifiers are not assumed to be numeric.

Valid identifiers may include formats such as:

```text
CUS-10025
CR-2026-001
ACC_0054
```

The validation engine can flag suspicious patterns including:

* IDs that are unusually short
* extremely long IDs
* leading or trailing spaces
* internal spaces
* unusual characters
* repeated separators
* separators at the beginning or end

Suspicious IDs generate warnings rather than blocking errors.

---

# Status Validation

Business statuses are validated against an application-defined catalog.

Current default values include:

```text
Activo
Inactivo
Pendiente
```

Status comparison uses normalization.

Therefore:

```text
Activo
activo
ACTIVO
 Activo
```

are recognized as equivalent valid statuses.

Values such as:

```text
Actiov
Cancelado
Desconocido
```

are reported as invalid statuses.

The catalog is designed so that future versions can make statuses configurable.

---

# Data Quality Score V2

The platform implements an **application-defined Data Quality Score**.

It is intentionally not presented as an international or industry standard.

The goal is to provide a simple, explainable, and defensible scoring mechanism.

The score begins at:

```text
100
```

and applies weighted penalties based on:

* rows containing blocking issues
* rows containing warnings
* duplicate identifiers
* structural problems

Conceptually:

```text
Score = 100

- blocking issue impact
- warning impact
- duplicate impact
- structural validation impact
```

Blocking problems have significantly more impact than warnings.

The final score is constrained between:

```text
0 – 100
```

---

## Data Quality Metrics

Each imported dataset includes metrics such as:

```text
Data Quality Score

Blocking Issues
Warnings
Duplicate IDs
Invalid Values

Total Rows
Clean Rows
Rows With Issues
```

The platform also displays an **Issue Breakdown**.

Example:

```text
Duplicate ID        1
Invalid Amount      2
Suspicious ID       3
Unexpected Column   2
```

---

# Normalization Engine

Before comparing textual values, the platform normalizes selected information.

Normalization includes:

* trimming whitespace
* collapsing repeated spaces
* lowercase conversion
* removing diacritics

Examples:

```text
"Medical Solutions CR"
" medical solutions cr "
"MEDICAL SOLUTIONS CR"
```

are considered equivalent after normalization.

Likewise:

```text
"Café Central"
"CAFE CENTRAL"
```

can produce a normalized match.

---

## Monetary Values

Amounts currently use strict comparison.

Example:

```text
120000
120001
```

produces:

```text
Difference
```

No monetary tolerance is currently applied.

---

# Reconciliation Results

The engine classifies records into five outcomes.

## Exact Match

All relevant values are identical.

```text
ERP = CRM
```

---

## Normalized Match

Values become equivalent after normalization.

Example:

```text
ERP: Café Central
CRM: CAFE CENTRAL
```

Result:

```text
Normalized Match
```

Normalized matches are considered successful reconciliations and **do not appear as exceptions**.

---

## Difference

The record exists in both systems but contains meaningful discrepancies.

Example:

```text
ERP amount: 120000
CRM amount: 120001
```

---

## Only ERP

The record exists in ERP but not CRM.

---

## Only CRM

The record exists in CRM but not ERP.

---

# Exception Management

Real reconciliation discrepancies are grouped into the Exceptions workflow.

Exceptions include:

* Difference
* Only ERP
* Only CRM

Normalized Matches are intentionally excluded.

Available controls include:

* search
* type filters
* Pending / Reviewed filters
* individual review status
* mark visible records as reviewed
* mark visible records as pending

Review progress is shared across the application.

---

# Dashboard

The dashboard provides a high-level overview of the current reconciliation.

Metrics include information such as:

* ERP records
* CRM records
* total unique records
* matched records
* differences
* ERP-only records
* CRM-only records
* reconciliation rate
* exception metrics
* data quality indicators

---

# Reports

The Reports module provides executive reconciliation analytics.

Current metrics include:

* Match Rate
* Exception Rate
* Review Completion
* Unique Records
* Matched Records
* Differences
* Only ERP
* Only CRM
* Exceptions
* Reconciliation Health
* ERP Data Quality
* CRM Data Quality

---

## Charts

Reports include visual analytics built with Recharts.

Current visualizations include:

* reconciliation distribution
* differences by field
* data quality metrics
* reconciliation health indicators

---

# Reconciliation History

Every successful reconciliation can create a historical snapshot.

History captures information such as:

```text
Execution Date
ERP Dataset
CRM Dataset

ERP Data Quality
CRM Data Quality

Unique Records
Matched Records
Exact Matches
Normalized Matches

Differences
Only ERP
Only CRM
Exceptions

Match Rate

ERP Field Mapping
CRM Field Mapping
```

Historical entries are intentionally compact.

The application does **not** duplicate every raw ERP and CRM record for every historical run.

---

## History Analytics

History provides aggregated metrics such as:

* Total Runs
* Average Match Rate
* Best Match Rate
* Average Data Quality

Visual analytics include:

* Match Rate vs Data Quality trend
* Exceptions by reconciliation run

This makes it possible to evaluate reconciliation performance over time.

---

# PDF Reporting

The application provides PDF exports using:

* jsPDF
* jsPDF-AutoTable
* html2canvas

Reports are designed to include:

* executive metrics
* reconciliation results
* charts
* exception information
* historical performance
* data quality information
* field mapping audit information
* page numbering
* report metadata

---

# CSV Export

Reconciliation information can also be exported as CSV for further analysis.

---

# Dark Mode

The application includes light and dark appearance modes.

The selected theme is persisted between sessions.

The UI follows a modern enterprise SaaS visual system built with Material UI.

---

# Persistence

The current frontend uses browser storage to preserve application state.

Persisted information includes:

* ERP dataset
* CRM dataset
* validation results
* data quality metrics
* reconciliation result
* exception review status
* reconciliation history
* field mapping profiles
* appearance preference

The current implementation uses:

```text
localStorage
```

This is intentionally a **frontend development persistence layer**.

It is not intended to be the final enterprise storage solution.

---

# Planned Backend Architecture

A future backend version will replace frontend-only persistence with:

```text
React
   ↓
REST API
   ↓
NestJS
   ↓
Prisma ORM
   ↓
PostgreSQL
```

Potential backend entities include:

```text
User
Dataset
Import
ImportRow
DataQualityIssue
FieldMapping
Reconciliation
ReconciliationResult
Exception
ExceptionReview
Report
```

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Material UI
* React Router

## Data Processing

* PapaParse
* Zod

## Visualization

* Recharts

## Reporting

* jsPDF
* jsPDF-AutoTable
* html2canvas

## Icons

* Lucide React

## Persistence

* localStorage

## Version Control

* Git
* GitHub

---

# Project Structure

```text
src/
├── components/
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
│
├── config/
│   ├── dataQualityConfig.ts
│   ├── fieldMappingConfig.ts
│   └── storageConfig.ts
│
├── context/
│   ├── ReconciliationContext.tsx
│   └── ThemeModeContext.tsx
│
├── layouts/
│   └── MainLayout.tsx
│
├── pages/
│   ├── Dashboard/
│   ├── Imports/
│   ├── Reconciliation/
│   ├── Exceptions/
│   ├── Reports/
│   ├── History/
│   └── Settings/
│
├── schemas/
│   └── reconciliationSchema.ts
│
├── types/
│   ├── CsvValidation.ts
│   ├── FieldMapping.ts
│   ├── ImportedDataset.ts
│   ├── ReconciliationHistory.ts
│   ├── ReconciliationRecord.ts
│   └── ReconciliationResult.ts
│
├── utils/
│   ├── dataQuality.ts
│   ├── fieldMapping.ts
│   ├── normalizeData.ts
│   ├── parseCsv.ts
│   ├── reconcileData.ts
│   ├── reconciliationHistory.ts
│   └── workspacePersistence.ts
│
├── App.tsx
├── main.tsx
├── index.css
└── theme.ts
```

Additional test datasets are available under:

```text
sample-data/
```

---

# Installation

Clone the repository:

```bash
git clone https://github.com/Osarii/enterprise-data-reconciliation.git
```

Open the project:

```bash
cd enterprise-data-reconciliation
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# Production Build

Create a production build with:

```bash
npm run build
```

The application uses TypeScript build validation before the Vite production build.

---

# Sample Data

The repository includes datasets for testing different application scenarios.

Examples include:

```text
advanced-validation-good.csv
advanced-validation-warnings.csv
advanced-validation-errors.csv

persistence-test-erp.csv
persistence-test-crm.csv

field-mapping-erp.csv
field-mapping-crm.csv
```

These datasets test:

* clean information
* warnings
* blocking issues
* duplicate detection
* invalid values
* suspicious IDs
* field mapping
* normalization
* differences
* ERP-only records
* CRM-only records

---

# Example Reconciliation Workflow

```text
1. Import ERP CSV
            ↓
2. Configure Field Mapping
            ↓
3. Validate ERP
            ↓
4. Import CRM CSV
            ↓
5. Configure Field Mapping
            ↓
6. Validate CRM
            ↓
7. Review Data Quality
            ↓
8. Execute Reconciliation
            ↓
9. Analyze Matches & Differences
            ↓
10. Review Exceptions
            ↓
11. Analyze Reports
            ↓
12. Save Historical Snapshot
            ↓
13. Export CSV / PDF
```

---

# Development Roadmap

## V0.1 — Frontend Foundation

### V0.1.0

* CSV imports
* basic reconciliation
* dashboard
* exceptions
* reports

### V0.1.1

* duplicate detection
* data quality improvements
* required header validation

### V0.1.2

* normalization engine
* Exact Match
* Normalized Match
* Difference classification

### V0.1.3

* advanced validation
* structured data quality issues
* severity system
* suspicious ID detection
* configurable status validation
* Data Quality Score V2

### V0.1.4

* workspace persistence
* dark mode
* settings

### V0.1.5

* reconciliation history
* persistent historical snapshots

### V0.1.6

* configurable field mapping
* historical analytics
* history charts
* history PDF reporting
* field mapping audit

---

# Next Development Goals

Before moving to the backend, the frontend will continue to be hardened.

Potential improvements include:

* enhanced configurable mappings
* configurable reconciliation rules
* improved PDF reporting
* additional analytics
* performance optimization
* code splitting
* large dataset handling
* improved accessibility
* automated tests
* import templates
* additional audit information

---

# V0.2 — Backend

Planned stack:

```text
NestJS
PostgreSQL
Prisma
```

Planned capabilities:

* persistent server-side datasets
* reconciliation database
* historical storage
* exception persistence
* configurable business rules
* API-based reconciliation
* stronger auditability

---

# Future V1.0 Direction

The long-term objective is to evolve the platform into a complete enterprise reconciliation system with:

* authentication
* role-based access control
* organization workspaces
* persistent datasets
* reconciliation jobs
* scheduled reconciliations
* configurable mapping profiles
* configurable matching rules
* configurable tolerances
* historical comparisons
* exception assignment
* audit logs
* reporting
* exports
* enterprise dashboards
* backend persistence
* scalable processing

---

# Current Limitations

The project is still under active development.

Current limitations include:

* frontend-only persistence
* browser storage limitations
* no authentication
* no backend API
* no multi-user collaboration
* fixed canonical reconciliation fields
* reconciliation executes client-side
* very large datasets are not yet optimized

These limitations are expected to be addressed progressively throughout the roadmap.

---

# Engineering Goals

This project is being developed with an emphasis on:

* maintainable architecture
* clear TypeScript interfaces
* strict typing
* separation of concerns
* reusable business logic
* enterprise-oriented UX
* explainable validation rules
* explainable data quality metrics
* realistic business workflows
* progressive migration toward a full-stack architecture

---

## Repository

```text
https://github.com/Osarii/enterprise-data-reconciliation
```

---

## Project Status

```text
Current development version: v0.1.6
Status: Active Development
Architecture: Frontend-first
Next major milestone: Backend integration
```

---

**Enterprise Data Reconciliation Platform**

Turning cross-system inconsistencies into measurable, reviewable and actionable reconciliation results.
