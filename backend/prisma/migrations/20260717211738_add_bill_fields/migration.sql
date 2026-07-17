-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT DEFAULT 'pending';
