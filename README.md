Enterprise Data Reconciliation Platform










A modern enterprise-oriented data reconciliation platform designed to compare ERP and CRM datasets, detect inconsistencies, evaluate data quality, apply configurable reconciliation rules, manage exceptions, analyze historical performance, measure processing performance, and generate executive reports.

The project focuses on a common enterprise problem:

How can organizations reliably identify, explain, review, and report inconsistencies between business systems that are expected to contain equivalent information?

Overview

Organizations frequently operate multiple systems containing overlapping business information:

ERP platforms

CRM systems

Billing platforms

Financial systems

Customer databases

Internal operational applications

Over time, inconsistencies can appear because of:

manual data entry

synchronization failures

duplicate records

formatting inconsistencies

missing information

invalid values

schema differences

integration failures

different business rules between systems

Enterprise Data Reconciliation Platform provides an end-to-end frontend workflow for:

importing ERP and CRM datasets

mapping source columns into a canonical schema

validating data quality

identifying blocking issues and warnings

normalizing comparable values

configuring reconciliation rules

reconciling records

reviewing exceptions

measuring processing performance

analyzing historical executions

exporting CSV and PDF reports

Current Version

V0.1.10 — Frontend Release Candidate

The current frontend includes:

ERP and CRM CSV imports

PapaParse CSV parsing

Zod validation

configurable field mapping

automatic mapping suggestions

structured Data Quality Issues

BLOCKING and WARNING severities

Data Quality Score V2

duplicate ID detection

suspicious ID detection

configurable status validation

text normalization

Exact Match

Normalized Match

Tolerance Match

Difference detection

Only ERP / Only CRM detection

configurable reconciliation rules

configurable absolute amount tolerance

exception management

executive dashboard

operational reports

Recharts visualizations

CSV export

PDF export

reconciliation history

historical analytics

field mapping audit

reconciliation rule audit

processing performance metrics

workload classification

Web Worker reconciliation

large dataset safety

browser persistence

dark mode

lazy-loaded routes

deferred heavy PDF dependencies

responsive navigation

mobile/tablet Drawer navigation

quick navigation search

dynamic workspace alerts

global Error Boundary

404 / Not Found page

accessibility improvements

47 automated tests

GitHub Actions CI

The current application is intentionally frontend-first.

The next major phase is planned around NestJS, PostgreSQL, Prisma, and a REST API.

Enterprise Use Cases

A platform like this can be used internally by organizations that need to compare information stored in different systems.

Typical scenarios include:

ERP vs CRM customer reconciliation

finance and billing reconciliation

migration validation between legacy and new systems

order and inventory reconciliation

payment reconciliation

data quality reviews

integration monitoring

operational exception management

audit support

historical integration performance analysis

Example:

ERP
ID: CUS-1025
Customer: Medical Solutions CR
Amount: 850000
Status: Activo

CRM
ID: CUS-1025
Customer: MEDICAL SOLUTIONS CR
Amount: 850000
Status: ACTIVO

The platform can classify this as:

Normalized Match

while:

ERP Amount: 850000
CRM Amount: 825000

can become:

Difference

and enter the exception review workflow.

Core Workflow

flowchart TD
    ERP["ERP CSV"] --> MAP["Field Mapping"]
    CRM["CRM CSV"] --> MAP

    MAP --> PARSE["CSV Parsing"]
    PARSE --> VALIDATE["Advanced Validation"]
    VALIDATE --> QUALITY["Data Quality Analysis"]
    QUALITY --> RULES["Reconciliation Rules"]

    RULES --> WORKER["Web Worker"]
    WORKER --> NORMALIZE["Normalization Engine"]
    NORMALIZE --> ENGINE["Reconciliation Engine"]

    ENGINE --> EXACT["Exact Match"]
    ENGINE --> NORMALIZED["Normalized Match"]
    ENGINE --> TOLERANCE["Tolerance Match"]
    ENGINE --> DIFFERENCE["Difference"]
    ENGINE --> ERPONLY["Only ERP"]
    ENGINE --> CRMONLY["Only CRM"]

    EXACT --> REPORTS["Dashboard and Reports"]
    NORMALIZED --> REPORTS
    TOLERANCE --> REPORTS

    DIFFERENCE --> EXCEPTIONS["Exceptions Workflow"]
    ERPONLY --> EXCEPTIONS
    CRMONLY --> EXCEPTIONS

    EXCEPTIONS --> REPORTS
    REPORTS --> HISTORY["Reconciliation History"]
    HISTORY --> EXPORT["CSV and PDF Export"]

Canonical Data Model

The current reconciliation model uses four canonical fields:

Field

Description

id

Unique business identifier

cliente

Customer or entity name

monto

Monetary value

estado

Business status

The source CSV files do not have to use these exact column names because Field Mapping translates source schemas into the canonical model.

Configurable Field Mapping

An ERP dataset may contain:

customer_id
customer_name
balance
status

while a CRM dataset may contain:

account_code
display_name
amount_due
lifecycle_status

They can be mapped to:

id
cliente
monto
estado

Example ERP mapping:

customer_id     → id
customer_name   → cliente
balance         → monto
status          → estado

Example CRM mapping:

account_code       → id
display_name       → cliente
amount_due         → monto
lifecycle_status   → estado

This keeps source-specific schemas separate from the reconciliation engine.

Advanced Validation

Validation issues use a structured model rather than only plain strings.

A Data Quality Issue can include:

type
severity
message
row
field
value
relatedRows

Current issue categories include:

Missing Value

Invalid Amount

Negative Amount

Duplicate ID

Invalid Status

Suspicious ID

Unexpected Column

Missing Column

CSV Parse Error

Empty File

Severity System

BLOCKING

Blocking issues prevent reconciliation.

Examples:

missing required values

invalid amounts

negative amounts

duplicate IDs

invalid statuses

missing required columns

CSV parsing failures

empty datasets

WARNING

Warnings identify suspicious information without preventing reconciliation.

Examples:

suspicious IDs

unexpected columns

Duplicate Detection

Duplicate identifiers are blocking issues because the reconciliation process expects the ID to uniquely identify a record.

Example:

Duplicate ID: DUP-001

Rows:
3, 4

Suspicious ID Detection

Enterprise identifiers are not assumed to be numeric.

Valid identifiers can include:

CUS-10025
CR-2026-001
ACC_0054

The platform can warn about:

unusually short IDs

extremely long IDs

leading or trailing spaces

internal spaces

unusual characters

repeated separators

separators at the beginning or end

Suspicious IDs are warnings rather than blocking errors.

Status Validation

Current default status values include:

Activo
Inactivo
Pendiente

Validation uses normalization, so:

Activo
activo
ACTIVO
 Activo

are recognized as equivalent valid values.

Examples such as:

Actiov
Cancelado
Desconocido

are reported as invalid.

Data Quality Score V2

The platform implements an application-defined Data Quality Score.

It is not presented as an international standard.

The score begins at 100 and applies weighted penalties based on factors such as:

rows containing blocking issues

rows containing warnings

duplicate identifiers

structural validation problems

Conceptually:

Score = 100
        - Blocking Impact
        - Warning Impact
        - Duplicate Impact
        - Structural Impact

Blocking issues have significantly more impact than warnings.

The final score is constrained between:

0 – 100

Each dataset also exposes:

Data Quality Score

Blocking Issues

Warnings

Duplicate IDs

Invalid Values

Total Rows

Clean Rows

Rows With Issues

Issue Breakdown

Normalization Engine

Text normalization includes:

trimming whitespace

collapsing repeated spaces

lowercase conversion

removing diacritics

Examples:

Medical Solutions CR
 medical solutions cr
MEDICAL SOLUTIONS CR

are equivalent after normalization.

Likewise:

Café Central
CAFE CENTRAL

can produce a Normalized Match.

Configurable Reconciliation Rules

Current configurable rules include:

customer normalization

status normalization

amount tolerance

exact ID matching

ID matching intentionally remains exact.

Amount Tolerance

Amount comparison can operate in:

Strict Mode

or:

Absolute Tolerance

Example with tolerance ±5:

ERP amount: 5000
CRM amount: 5003

Difference = 3
Tolerance  = 5

→ Tolerance Match

But:

ERP amount: 10000
CRM amount: 10020

Difference = 20
Tolerance  = 5

→ Difference

Tolerance Matches are successful reconciliations and do not appear as exceptions.

Reconciliation Outcomes

The engine classifies records into six outcomes:

Exact Match

Raw values match exactly.

Normalized Match

Differences disappear after configured text normalization.

Tolerance Match

A configured reconciliation rule accepts the difference.

Difference

The record exists in both systems but contains a meaningful discrepancy.

Only ERP

The record exists only in ERP.

Only CRM

The record exists only in CRM.

Exception Management

Exceptions include only real reconciliation problems:

Difference

Only ERP

Only CRM

Successful matches are excluded:

Exact Match

Normalized Match

Tolerance Match

The Exceptions workflow supports:

search

type filters

Pending / Reviewed states

individual review status

bulk visible review

bulk pending reset

Reconciliation Metrics

Current metrics include:

ERP Records

CRM Records

Unique Records

Matched

Exact Matches

Normalized Matches

Tolerance Matches

Differences

Only ERP

Only CRM

Exceptions

Match Rate

Exception Rate

Review Completion

Reconciliation Health

Dashboard

The Dashboard provides an executive overview of the active reconciliation and its key operational metrics.

Reports

The Reports module includes:

Match Rate

Exception Rate

Review Completion

Unique Records

Exact Matches

Normalized Matches

Tolerance Matches

Differences

Only ERP

Only CRM

Exceptions

ERP Data Quality

CRM Data Quality

Reconciliation Health

Processing Performance

Charts and Analytics

Visualizations use Recharts.

Current analytics include:

reconciliation distribution

differences by field

data quality indicators

historical match rate

historical data quality

exceptions by run

tolerance matches by run

processing performance

PDF Reporting

PDF export uses:

jsPDF

jsPDF-AutoTable

html2canvas

Reports can include:

executive metrics

reconciliation results

Data Quality information

reconciliation rules

field mappings

processing performance

historical trends

charts

audit information

report metadata

page numbering

Heavy PDF dependencies are loaded on demand instead of during initial application startup.

CSV Export

Reconciliation data can be exported as CSV for additional analysis in tools such as:

Excel

Power BI

Python

R

enterprise reporting platforms

Reconciliation History

Every successful reconciliation creates a compact historical snapshot.

History records:

execution date

ERP dataset

CRM dataset

dataset sizes

Data Quality scores

Unique Records

Matched

Exact Matches

Normalized Matches

Tolerance Matches

Differences

Only ERP

Only CRM

Exceptions

Match Rate

processing metrics

field mapping profile

reconciliation rule profile

Historical entries intentionally avoid duplicating every raw dataset record.

History Analytics

History provides:

Total Runs

Average Match Rate

Best Match Rate

Average Data Quality

Average Reconciliation Time

Average Throughput

Largest Run

Charts include:

Match Rate vs Data Quality

Exceptions vs Tolerance Matches

Processing Performance

The history PDF also includes integration and reconciliation-rule audit information.

Processing Performance

The application records browser-observed processing metrics such as:

CSV Parse Time

Validation Time

Import Processing Time

Reconciliation Time

Rows Processed

Throughput

Workload Tier

These values are application instrumentation, not scientific benchmark results.

Workload Classification

Current application-defined workload categories are:

Small   ≤ 5,000 rows
Medium  5,001 – 20,000 rows
Large   > 20,000 rows

They are used for UI guidance and processing/persistence decisions.

Web Worker Reconciliation

Large reconciliation jobs execute outside the browser's main UI thread.

React UI
   │
   │ postMessage
   ▼
Web Worker
   │
   ├── normalization
   ├── matching
   ├── reconciliation rules
   └── processing metrics
   │
   ▼
React UI

The application has been manually tested with datasets including:

1,000 records
5,000 records
10,000 records
25,000 ERP + 25,000 CRM records

The 25k + 25k scenario was used to detect and resolve main-thread freezes and browser storage exhaustion.

Large Dataset Safety

localStorage is not treated as unlimited enterprise storage.

For smaller workspaces, the application can persist the active dataset.

For large datasets, the application switches to:

Large Dataset Mode

Large raw datasets remain in memory while compact information continues to be persisted:

reconciliation history

performance metrics

field mappings

reconciliation rules

settings

This prevents browser storage exhaustion.

Persistence

Current frontend persistence uses:

localStorage

for development-stage persistence.

Persisted information can include:

workspace state

history

exception review status

field mappings

reconciliation rules

appearance settings

historical metrics

This is temporary architecture. The backend phase will replace browser persistence with server-side storage.

Dark Mode

The application supports Light Mode and Dark Mode, with the selected preference persisted between sessions.

Responsive UX

V0.1.10 adds a more complete responsive shell.

Desktop:

persistent sidebar

full search

alerts

user actions

Mobile and tablet:

sidebar becomes a Drawer

navigation is available from the Header

responsive layouts reduce horizontal pressure

Quick Navigation Search

The Header search can navigate between application modules.

Examples:

pdf       → Reports
tolerance → Reconciliation
storage   → Settings
history   → History

Workspace Alerts

The Header notification control surfaces workspace-relevant alerts such as:

blocking Data Quality issues

reconciliation exceptions

Large Dataset Mode

persistence problems

Accessibility & Resilience

V0.1.10 introduces:

Skip to main content

route announcements for assistive technologies

improved focus-visible states

reduced-motion support

global Error Boundary

dedicated 404 page

route-aware document titles

Code Splitting

Application pages are lazy loaded:

Dashboard

Imports

Reconciliation

Exceptions

Reports

History

Settings

Heavy reporting dependencies are also deferred until needed.

Automated Testing

Testing uses Vitest.

Current local regression suite:

Test Files: 10 passed
Tests:      47 passed

Test areas include:

normalization

Data Quality

field mapping

reconciliation rules

schema validation

reconciliation engine

performance metrics

reconciliation history

persistence

navigation configuration

Regression Scenarios

Important business behavior is protected automatically.

Strict Amount Comparison

Expected:

Unique        6
Matched       2
Exact         1
Normalized    1
Tolerance     0
Differences   2
Only ERP      1
Only CRM      1
Match Rate    33.3%

Amount Tolerance ±5

Expected:

Unique        6
Matched       3
Exact         1
Normalized    1
Tolerance     1
Differences   1
Only ERP      1
Only CRM      1
Match Rate    50%

Testing Commands

Watch mode:

npm run test

Run once:

npm run test:run

Coverage:

npm run test:coverage

Production build:

npm run build

Quality Gate

The project includes:

.\scripts\run-quality-gate.ps1

Recommended flow:

npm run test:run
       ↓
npm run build
       ↓
git commit
       ↓
git push
       ↓
GitHub Actions

GitHub Actions CI

The repository contains:

.github/workflows/ci.yml

The workflow runs on pushes and Pull Requests.

Pipeline:

Checkout
   ↓
Setup Node.js
   ↓
npm ci
   ↓
npm run test:run
   ↓
npm run build
   ↓
Success / Failure

Technology Stack

Frontend

React

TypeScript

Vite

Material UI

React Router

Data Processing

PapaParse

Zod

Visualization

Recharts

Reporting

jsPDF

jsPDF-AutoTable

html2canvas

Performance

Web Workers

lazy loading

dynamic imports

processing instrumentation

Testing

Vitest

jsdom

V8 Coverage

CI

GitHub Actions

Persistence

localStorage

memory-only Large Dataset Mode

Version Control

Git

GitHub

Project Structure

src/
├── components/
│   ├── common/
│   │   ├── AppErrorBoundary.tsx
│   │   ├── PageLoader.tsx
│   │   └── RouteAnnouncer.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── config/
│   ├── dataQualityConfig.ts
│   ├── fieldMappingConfig.ts
│   ├── navigationConfig.ts
│   ├── performanceConfig.ts
│   ├── reconciliationRulesConfig.ts
│   └── storageConfig.ts
├── context/
│   ├── ReconciliationContext.tsx
│   └── ThemeModeContext.tsx
├── layouts/
│   └── MainLayout.tsx
├── pages/
│   ├── Dashboard/
│   ├── Imports/
│   ├── Reconciliation/
│   ├── Exceptions/
│   ├── Reports/
│   ├── History/
│   ├── Settings/
│   └── NotFound/
├── schemas/
│   └── reconciliationSchema.ts
├── types/
├── utils/
├── workers/
│   └── reconciliation.worker.ts
├── App.tsx
├── main.tsx
├── index.css
└── theme.ts

tests/
├── normalizeData.test.ts
├── dataQuality.test.ts
├── fieldMapping.test.ts
├── reconciliationRules.test.ts
├── reconciliationSchema.test.ts
├── reconcileData.test.ts
├── performanceMetrics.test.ts
├── reconciliationHistory.test.ts
├── workspacePersistence.test.ts
└── navigationConfig.test.ts

scripts/
├── generate-performance-data.mjs
├── setup-testing.ps1
└── run-quality-gate.ps1

.github/
└── workflows/
    └── ci.yml

sample-data/
└── performance/

Installation

Clone the repository:

git clone https://github.com/Osarii/enterprise-data-reconciliation.git

Enter the project:

cd enterprise-data-reconciliation

Install dependencies:

npm install

Run the application:

npm run dev

Production Validation

Run tests:

npm run test:run

Build:

npm run build

A healthy state should have:

Tests  ✅
Build  ✅
CI     ✅

Sample Data

The repository contains dedicated datasets for multiple scenarios.

Advanced Validation

advanced-validation-good.csv
advanced-validation-warnings.csv
advanced-validation-errors.csv

Persistence

persistence-test-erp.csv
persistence-test-crm.csv

Field Mapping

field-mapping-erp.csv
field-mapping-crm.csv

Reconciliation Rules

reconciliation-rules-erp.csv
reconciliation-rules-crm.csv

Performance

performance-1k-erp.csv
performance-1k-crm.csv
performance-5k-erp.csv
performance-5k-crm.csv
performance-10k-erp.csv
performance-10k-crm.csv
performance-25k-erp.csv
performance-25k-crm.csv

Development Roadmap

V0.1 — Frontend Foundation

V0.1.0 — Core Platform

CSV imports

basic reconciliation

Dashboard

Exceptions

Reports

V0.1.1 — Duplicate Detection + Data Quality

duplicate detection

required headers

Data Quality improvements

V0.1.2 — Normalization Engine

normalization

Exact Match

Normalized Match

Difference classification

V0.1.3 — Advanced Validation

structured issues

severity system

suspicious IDs

status validation

Data Quality Score V2

V0.1.4 — Persistence + Dark Mode

workspace persistence

Dark Mode

Settings

V0.1.5 — Reconciliation History

compact historical snapshots

history persistence

V0.1.6 — Field Mapping + History Analytics

configurable field mapping

mapping suggestions

historical charts

History PDF

mapping audit

V0.1.7 — Configurable Reconciliation Rules

configurable normalization rules

amount tolerance

Tolerance Match

rule audit

V0.1.8 — Performance & Scalability

lazy loading

code splitting

deferred PDF dependencies

processing metrics

workload classification

synthetic performance datasets

V0.1.8.1 — Large Dataset Safety

Web Worker reconciliation

non-blocking processing

Large Dataset Mode

browser storage safety

History navigation fixes

V0.1.9 — Testing & Reliability

Vitest

regression suite

persistence tests

reconciliation engine tests

GitHub Actions CI

quality gate

V0.1.10 — Frontend Release Candidate

responsive shell

mobile Drawer

quick navigation

dynamic alerts

Error Boundary

Not Found page

accessibility improvements

route announcements

47 passing tests

Next Major Phase

V0.2.0 — Backend Foundation

Planned stack:

React
   ↓
REST API
   ↓
NestJS
   ↓
Prisma ORM
   ↓
PostgreSQL

Planned backend capabilities:

server-side dataset persistence

reconciliation persistence

history persistence

exception persistence

API-based reconciliation

field mapping profiles

rule profiles

audit records

scalable storage

preparation for authentication and multi-user workflows

Potential entities:

User
Organization
Dataset
Import
ImportRow
DataQualityIssue
FieldMapping
ReconciliationRule
Reconciliation
ReconciliationResult
Exception
ExceptionReview
Report
AuditLog

Future V1.0 Direction

Potential V1.0 capabilities include:

authentication

role-based access control

organization workspaces

persistent datasets

reconciliation jobs

scheduled reconciliations

reusable mapping profiles

configurable matching rules

configurable tolerances

historical comparisons

exception assignment

audit logs

advanced reporting

API integrations

enterprise dashboards

multi-user collaboration

PostgreSQL persistence

scalable background processing

Current Limitations

The project remains under active development.

Current limitations include:

no production backend yet

no authentication

no multi-user collaboration

fixed canonical reconciliation fields

large active datasets are memory-only

no scheduled reconciliation jobs

no direct ERP/CRM API integrations yet

These limitations are deliberate milestones in the roadmap.

Engineering Goals

The project emphasizes:

strict TypeScript

separation of concerns

maintainable architecture

reusable business logic

explainable validation

explainable Data Quality metrics

configurable reconciliation rules

auditability

enterprise-oriented UX

non-blocking processing

measurable performance

automated regression protection

CI validation

progressive full-stack architecture

Why This Project Exists

Data reconciliation is a real operational challenge.

An organization may have:

ERP
CRM
Billing
Financial System
Internal Database
Data Warehouse

all containing information about the same customers or transactions.

Small inconsistencies can create:

financial reporting problems

operational errors

incorrect customer information

integration failures

duplicated manual work

audit difficulties

The project transforms those inconsistencies into:

Detectable
    ↓
Measurable
    ↓
Explainable
    ↓
Reviewable
    ↓
Auditable
    ↓
Reportable

Repository

GitHub

https://github.com/Osarii/enterprise-data-reconciliation

Project Status

Current Version:    V0.1.10
Status:             Frontend Release Candidate
Automated Tests:    47 passing locally
Test Suites:        10 passing locally
CI:                 GitHub Actions configured
Architecture:       Frontend-first
Large Data:         Web Worker + Large Dataset Safety
Next Major Phase:   V0.2.0 Backend Foundation

Author

Jared Prendas

Computer Engineering student focused on:

Full-Stack Development

Enterprise Applications

Software Engineering

Data-oriented systems

Practical business technology solutions

GitHub:

https://github.com/Osarii

License

This project is currently developed as an educational and portfolio project.

A formal open-source license may be added in a future release.

Enterprise Data Reconciliation Platform

Turning cross-system inconsistencies into measurable, explainable, reviewable, auditable, and actionable reconciliation results.
