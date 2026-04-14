-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('OK', 'ATTENTION', 'NA');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('GREEN', 'CAUTION', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "plant_type" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plants" (
    "user_id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,

    CONSTRAINT "user_plants_pkey" PRIMARY KEY ("user_id","plant_id")
);

-- CreateTable
CREATE TABLE "checklist_sections" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "checklist_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL,
    "requires_note_on_attention" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_fields" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lab_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_tags" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "observation_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threshold_rules" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "lab_field_id" TEXT NOT NULL,
    "caution_low" DOUBLE PRECISION,
    "caution_high" DOUBLE PRECISION,
    "critical_low" DOUBLE PRECISION,
    "critical_high" DOUBLE PRECISION,
    "suggestion_text" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "threshold_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_rules" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "suggestion_text" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'CAUTION',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tag_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_rounds" (
    "id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "signed_off" BOOLEAN NOT NULL DEFAULT false,
    "status" "RoundStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "overall_condition" "Condition",
    "notes" TEXT,

    CONSTRAINT "daily_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_entries" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "status" "ChecklistStatus" NOT NULL,
    "note" TEXT,
    "image_url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_entries" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "lab_field_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_entries" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "area" TEXT,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observation_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_taken" TEXT,
    "supervisor_flag" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "daily_rounds_plant_id_operator_id_date_key" ON "daily_rounds"("plant_id", "operator_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_entries_round_id_item_id_key" ON "checklist_entries"("round_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_entries_round_id_lab_field_id_key" ON "lab_entries"("round_id", "lab_field_id");

-- AddForeignKey
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_sections" ADD CONSTRAINT "checklist_sections_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "checklist_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_fields" ADD CONSTRAINT "lab_fields_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_tags" ADD CONSTRAINT "observation_tags_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threshold_rules" ADD CONSTRAINT "threshold_rules_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threshold_rules" ADD CONSTRAINT "threshold_rules_lab_field_id_fkey" FOREIGN KEY ("lab_field_id") REFERENCES "lab_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_rules" ADD CONSTRAINT "tag_rules_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_rules" ADD CONSTRAINT "tag_rules_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "observation_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_rounds" ADD CONSTRAINT "daily_rounds_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_rounds" ADD CONSTRAINT "daily_rounds_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_entries" ADD CONSTRAINT "lab_entries_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_entries" ADD CONSTRAINT "lab_entries_lab_field_id_fkey" FOREIGN KEY ("lab_field_id") REFERENCES "lab_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_entries" ADD CONSTRAINT "observation_entries_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_entries" ADD CONSTRAINT "observation_entries_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "observation_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
