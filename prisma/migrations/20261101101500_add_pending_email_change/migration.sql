-- AlterEnum
ALTER TYPE "EmailTokenType" ADD VALUE 'EMAIL_CHANGE';

-- AlterTable
ALTER TABLE "EmailToken" ADD COLUMN     "newEmail" VARCHAR(255);

