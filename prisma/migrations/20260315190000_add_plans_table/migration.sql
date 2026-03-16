-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- Seed planos iniciais
INSERT INTO "plans" ("id", "name", "description", "price", "is_active", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'Basic', 'Plano básico com funcionalidades essenciais', 9.99, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Premium', 'Plano premium com todas as funcionalidades', 19.99, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
