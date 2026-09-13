-- Collaboration access and progress comments for findings.
CREATE TABLE "FindingParticipant" (
    "findingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FindingParticipant_pkey" PRIMARY KEY ("findingId", "userId")
);

CREATE TABLE "FindingComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FindingComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FindingParticipant_userId_idx" ON "FindingParticipant"("userId");
CREATE INDEX "FindingComment_findingId_createdAt_idx" ON "FindingComment"("findingId", "createdAt");

ALTER TABLE "FindingParticipant"
  ADD CONSTRAINT "FindingParticipant_findingId_fkey"
  FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FindingParticipant"
  ADD CONSTRAINT "FindingParticipant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FindingComment"
  ADD CONSTRAINT "FindingComment_findingId_fkey"
  FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FindingComment"
  ADD CONSTRAINT "FindingComment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
