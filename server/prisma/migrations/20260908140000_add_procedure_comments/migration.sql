-- Progress comments for procedures.
CREATE TABLE "ProcedureComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedureComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProcedureComment_procedureId_createdAt_idx" ON "ProcedureComment"("procedureId", "createdAt");

ALTER TABLE "ProcedureComment"
  ADD CONSTRAINT "ProcedureComment_procedureId_fkey"
  FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProcedureComment"
  ADD CONSTRAINT "ProcedureComment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
