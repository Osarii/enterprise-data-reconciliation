-- CreateEnum
CREATE TYPE "SourceSystem" AS ENUM ('ERP', 'CRM');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('BLOCKING', 'WARNING');

-- CreateEnum
CREATE TYPE "DataQualityIssueType" AS ENUM ('MISSING_VALUE', 'INVALID_AMOUNT', 'NEGATIVE_AMOUNT', 'DUPLICATE_ID', 'INVALID_STATUS', 'SUSPICIOUS_ID', 'UNEXPECTED_COLUMN', 'MISSING_COLUMN', 'CSV_PARSE_ERROR', 'EMPTY_FILE');

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceSystem" "SourceSystem" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "cleanRows" INTEGER NOT NULL DEFAULT 0,
    "rowsWithIssues" INTEGER NOT NULL DEFAULT 0,
    "dataQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "blockingIssues" INTEGER NOT NULL DEFAULT 0,
    "warnings" INTEGER NOT NULL DEFAULT 0,
    "duplicateIds" INTEGER NOT NULL DEFAULT 0,
    "invalidValues" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRow" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "recordId" TEXT,
    "cliente" TEXT,
    "monto" DECIMAL(18,2),
    "estado" TEXT,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityIssue" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "importRowId" TEXT,
    "type" "DataQualityIssueType" NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "rowNumber" INTEGER,
    "field" TEXT,
    "value" TEXT,
    "relatedRows" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataQualityIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dataset_sourceSystem_idx" ON "Dataset"("sourceSystem");

-- CreateIndex
CREATE INDEX "Import_datasetId_idx" ON "Import"("datasetId");

-- CreateIndex
CREATE INDEX "Import_status_idx" ON "Import"("status");

-- CreateIndex
CREATE INDEX "Import_createdAt_idx" ON "Import"("createdAt");

-- CreateIndex
CREATE INDEX "ImportRow_importId_idx" ON "ImportRow"("importId");

-- CreateIndex
CREATE INDEX "ImportRow_recordId_idx" ON "ImportRow"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportRow_importId_rowNumber_key" ON "ImportRow"("importId", "rowNumber");

-- CreateIndex
CREATE INDEX "DataQualityIssue_importId_idx" ON "DataQualityIssue"("importId");

-- CreateIndex
CREATE INDEX "DataQualityIssue_importRowId_idx" ON "DataQualityIssue"("importRowId");

-- CreateIndex
CREATE INDEX "DataQualityIssue_severity_idx" ON "DataQualityIssue"("severity");

-- CreateIndex
CREATE INDEX "DataQualityIssue_type_idx" ON "DataQualityIssue"("type");

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityIssue" ADD CONSTRAINT "DataQualityIssue_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityIssue" ADD CONSTRAINT "DataQualityIssue_importRowId_fkey" FOREIGN KEY ("importRowId") REFERENCES "ImportRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
