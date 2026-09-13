-- Synchronize the production database with the current Prisma schema.
ALTER TABLE "Action" DROP CONSTRAINT "Action_findingId_fkey";
ALTER TABLE "Action" DROP CONSTRAINT "Action_nonConformityId_fkey";
ALTER TABLE "Action" DROP CONSTRAINT "Action_opportunityId_fkey";
ALTER TABLE "Action" DROP CONSTRAINT "Action_riskId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_departmentId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_processId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_userId_fkey";
ALTER TABLE "NonConformity" DROP CONSTRAINT "NonConformity_processId_fkey";
ALTER TABLE "Opportunity" DROP CONSTRAINT "Opportunity_processId_fkey";
ALTER TABLE "Risk" DROP CONSTRAINT "Risk_processId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_actionId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_processId_fkey";

DROP INDEX "Task_actionId_idx";

ALTER TABLE "File" ADD COLUMN "findingId" TEXT;
ALTER TABLE "File" ALTER COLUMN "procedureId" DROP NOT NULL;

ALTER TABLE "Finding" DROP COLUMN "cause";
ALTER TABLE "Finding" DROP COLUMN "description";
ALTER TABLE "Finding" DROP COLUMN "evidence";
ALTER TABLE "Finding" DROP COLUMN "responsibleId";

ALTER TABLE "Task" DROP COLUMN "actionId";
ALTER TABLE "Task" DROP COLUMN "description";
ALTER TABLE "Task" DROP COLUMN "processId";
ALTER TABLE "Task" ADD COLUMN "departmentId" TEXT;

DROP TABLE "Action";
DROP TABLE "Activity";
DROP TABLE "NonConformity";
DROP TABLE "Opportunity";
DROP TABLE "Risk";

DROP TYPE "ActionStatus";
DROP TYPE "ActionType";
DROP TYPE "NonConformityStatus";
DROP TYPE "OpportunityStatus";
DROP TYPE "RiskStatus";

CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BonusKpiConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxPoints" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusKpiConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BonusKpiThreshold" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "minCount" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusKpiThreshold_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BonusFinding" (
    "id" TEXT NOT NULL,
    "detectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departmentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cause" TEXT,
    "impact" TEXT,
    "responsibleId" TEXT,
    "proposedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closeDate" TIMESTAMP(3),
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BonusImprovementAction" (
    "id" TEXT NOT NULL,
    "findingId" TEXT,
    "action" TEXT NOT NULL,
    "responsibleId" TEXT,
    "committedDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "evidence" TEXT,
    "result" TEXT,
    "indicatorBefore" TEXT,
    "indicatorAfter" TEXT,
    "resultValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusImprovementAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BonusProcedure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "identificationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsibleId" TEXT,
    "analysisStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "draftingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvalDate" TIMESTAMP(3),
    "diffusionDate" TIMESTAMP(3),
    "version" TEXT NOT NULL DEFAULT '1.0',
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusProcedure_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");
CREATE UNIQUE INDEX "BonusKpiConfig_key_key" ON "BonusKpiConfig"("key");
CREATE INDEX "BonusKpiThreshold_configId_idx" ON "BonusKpiThreshold"("configId");
CREATE UNIQUE INDEX "BonusKpiThreshold_configId_minCount_key" ON "BonusKpiThreshold"("configId", "minCount");
CREATE INDEX "BonusFinding_detectionDate_idx" ON "BonusFinding"("detectionDate");
CREATE INDEX "BonusFinding_departmentId_idx" ON "BonusFinding"("departmentId");
CREATE INDEX "BonusImprovementAction_closeDate_idx" ON "BonusImprovementAction"("closeDate");
CREATE INDEX "BonusImprovementAction_status_idx" ON "BonusImprovementAction"("status");
CREATE INDEX "BonusProcedure_identificationDate_idx" ON "BonusProcedure"("identificationDate");
CREATE INDEX "BonusProcedure_departmentId_idx" ON "BonusProcedure"("departmentId");
CREATE INDEX "BonusProcedure_processId_idx" ON "BonusProcedure"("processId");
CREATE UNIQUE INDEX "File_findingId_key" ON "File"("findingId");

ALTER TABLE "File" ADD CONSTRAINT "File_findingId_fkey"
  FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BonusKpiThreshold" ADD CONSTRAINT "BonusKpiThreshold_configId_fkey"
  FOREIGN KEY ("configId") REFERENCES "BonusKpiConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BonusFinding" ADD CONSTRAINT "BonusFinding_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BonusImprovementAction" ADD CONSTRAINT "BonusImprovementAction_findingId_fkey"
  FOREIGN KEY ("findingId") REFERENCES "BonusFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BonusProcedure" ADD CONSTRAINT "BonusProcedure_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BonusProcedure" ADD CONSTRAINT "BonusProcedure_processId_fkey"
  FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
