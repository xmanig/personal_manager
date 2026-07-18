-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "googleAccountId" TEXT;

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "googleAccountId" TEXT;

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT[],
    "filterRules" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAccount_email_key" ON "GoogleAccount"("email");

-- CreateIndex
CREATE INDEX "Bill_googleAccountId_idx" ON "Bill"("googleAccountId");

-- CreateIndex
CREATE INDEX "CalendarEvent_googleAccountId_idx" ON "CalendarEvent"("googleAccountId");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_googleAccountId_fkey" FOREIGN KEY ("googleAccountId") REFERENCES "GoogleAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_googleAccountId_fkey" FOREIGN KEY ("googleAccountId") REFERENCES "GoogleAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
