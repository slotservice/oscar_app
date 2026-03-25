-- Oscar MVP Database Schema
-- Generated from Prisma schema

-- Enums
CREATE TYPE "Role" AS ENUM ('OPERATOR', 'SUPERVISOR', 'ADMIN');
CREATE TYPE "ChecklistStatus" AS ENUM ('OK', 'ATTENTION', 'NA');
CREATE TYPE "RoundStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
CREATE TYPE "Condition" AS ENUM ('GREEN', 'YELLOW', 'RED');
CREATE TYPE "Severity" AS ENUM ('GREEN', 'CAUTION', 'CRITICAL');

-- Users
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Plants
CREATE TABLE "plants" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "plant_type" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- User-Plant assignments
CREATE TABLE "user_plants" (
    "user_id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    CONSTRAINT "user_plants_pkey" PRIMARY KEY ("user_id","plant_id"),
    CONSTRAINT "user_plants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "user_plants_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE
);

-- Checklist Sections
CREATE TABLE "checklist_sections" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "plant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "checklist_sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checklist_sections_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE
);

-- Checklist Items
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "section_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL,
    "requires_note_on_attention" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checklist_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "checklist_sections"("id") ON DELETE CASCADE
);

-- Lab Fields
CREATE TABLE "lab_fields" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "plant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "lab_fields_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lab_fields_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE
);

-- Observation Tags
CREATE TABLE "observation_tags" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "plant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "observation_tags_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "observation_tags_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE
);

-- Threshold Rules
CREATE TABLE "threshold_rules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "plant_id" TEXT NOT NULL,
    "lab_field_id" TEXT NOT NULL,
    "caution_low" DOUBLE PRECISION,
    "caution_high" DOUBLE PRECISION,
    "critical_low" DOUBLE PRECISION,
    "critical_high" DOUBLE PRECISION,
    "suggestion_text" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "threshold_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "threshold_rules_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE,
    CONSTRAINT "threshold_rules_lab_field_id_fkey" FOREIGN KEY ("lab_field_id") REFERENCES "lab_fields"("id") ON DELETE CASCADE
);

-- Tag Rules
CREATE TABLE "tag_rules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "plant_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "suggestion_text" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'CAUTION',
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "tag_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tag_rules_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE,
    CONSTRAINT "tag_rules_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "observation_tags"("id") ON DELETE CASCADE
);

-- Daily Rounds
CREATE TABLE "daily_rounds" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "plant_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "signed_off" BOOLEAN NOT NULL DEFAULT false,
    "status" "RoundStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "overall_condition" "Condition",
    "notes" TEXT,
    CONSTRAINT "daily_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "daily_rounds_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id"),
    CONSTRAINT "daily_rounds_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id")
);
CREATE UNIQUE INDEX "daily_rounds_plant_id_operator_id_date_key" ON "daily_rounds"("plant_id", "operator_id", "date");

-- Checklist Entries
CREATE TABLE "checklist_entries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "round_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "status" "ChecklistStatus" NOT NULL,
    "note" TEXT,
    "image_url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checklist_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checklist_entries_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE,
    CONSTRAINT "checklist_entries_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "checklist_items"("id")
);
CREATE UNIQUE INDEX "checklist_entries_round_id_item_id_key" ON "checklist_entries"("round_id", "item_id");

-- Lab Entries
CREATE TABLE "lab_entries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "round_id" TEXT NOT NULL,
    "lab_field_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lab_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lab_entries_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE,
    CONSTRAINT "lab_entries_lab_field_id_fkey" FOREIGN KEY ("lab_field_id") REFERENCES "lab_fields"("id")
);
CREATE UNIQUE INDEX "lab_entries_round_id_lab_field_id_key" ON "lab_entries"("round_id", "lab_field_id");

-- Observation Entries
CREATE TABLE "observation_entries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "round_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "area" TEXT,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "observation_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "observation_entries_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE,
    CONSTRAINT "observation_entries_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "observation_tags"("id")
);

-- Suggestions
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "round_id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "suggestions_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE
);

-- Issues
CREATE TABLE "issues" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "round_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_taken" TEXT,
    "supervisor_flag" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "issues_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "issues_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "daily_rounds"("id") ON DELETE CASCADE
);

-- Prisma migrations tracking (so Prisma knows schema is in sync)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP WITH TIME ZONE,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP WITH TIME ZONE,
    "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);
