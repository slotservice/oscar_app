-- CreateEnum
CREATE TYPE "OperatorLevel" AS ENUM ('VETERAN', 'EXPERIENCED', 'TRAINEE');

-- AlterEnum
ALTER TYPE "Condition" ADD VALUE 'ORANGE';

-- AlterTable
ALTER TABLE "checklist_items" ADD COLUMN     "minimum_level" "OperatorLevel" NOT NULL DEFAULT 'TRAINEE';

-- AlterTable
ALTER TABLE "daily_rounds" ADD COLUMN     "confidence_level" TEXT,
ADD COLUMN     "display_score" DOUBLE PRECISION,
ADD COLUMN     "primary_concern" TEXT,
ADD COLUMN     "score_breakdown" JSONB,
ADD COLUMN     "stability_score" DOUBLE PRECISION,
ADD COLUMN     "status_band" TEXT;

-- AlterTable
ALTER TABLE "lab_fields" ADD COLUMN     "is_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recommended_frequency" TEXT NOT NULL DEFAULT 'daily';

-- AlterTable
ALTER TABLE "suggestions" ADD COLUMN     "category" TEXT,
ADD COLUMN     "confidence" TEXT,
ADD COLUMN     "deduction" DOUBLE PRECISION,
ADD COLUMN     "rule_id" TEXT,
ADD COLUMN     "severity_level" INTEGER,
ADD COLUMN     "supporting_fields" JSONB,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "operator_level" "OperatorLevel" NOT NULL DEFAULT 'TRAINEE';
