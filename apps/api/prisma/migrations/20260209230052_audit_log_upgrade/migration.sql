-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "auth0Id" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "resource" TEXT,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "success" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;
