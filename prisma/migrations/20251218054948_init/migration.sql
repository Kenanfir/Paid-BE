-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('DRAFT', 'PROCESSING_FACES', 'READY_TO_SPLIT', 'SPLIT_CONFIRMED', 'CLOSED');

-- CreateEnum
CREATE TYPE "obligation_status" AS ENUM ('PENDING', 'MARKED_PAID', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "media_kind" AS ENUM ('GROUP_PHOTO', 'PAYMENT_PROOF', 'PROFILE_PHOTO');

-- CreateEnum
CREATE TYPE "participant_role" AS ENUM ('HOST', 'PLAYER');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('CASH', 'TRANSFER', 'EWALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_face_embeddings" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "embedding" BYTEA NOT NULL,
    "source_photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "player_face_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "session_status" NOT NULL DEFAULT 'DRAFT',
    "group_photo_url" TEXT,
    "total_amount" DECIMAL(12,2),
    "session_date" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_participants" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "role" "participant_role" NOT NULL DEFAULT 'PLAYER',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_items" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "kind" "media_kind" NOT NULL,
    "storage_url" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detected_faces" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "bounding_box" JSONB NOT NULL,
    "embedding" BYTEA NOT NULL,
    "face_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detected_faces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_match_suggestions" (
    "id" UUID NOT NULL,
    "detected_face_id" UUID NOT NULL,
    "suggested_player_id" UUID NOT NULL,
    "confidence_score" DECIMAL(5,4) NOT NULL,
    "rank" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_match_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_confirmations" (
    "id" UUID NOT NULL,
    "detected_face_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "confirmed_by" UUID NOT NULL,
    "confirmed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligations" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "payer_id" UUID NOT NULL,
    "payee_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "obligation_status" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "method" "payment_method" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference_number" VARCHAR(255),
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "verified_by" UUID,
    "rejection_reason" TEXT,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_link_tokens" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "purpose" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "players_user_id_key" ON "players"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");

-- CreateIndex
CREATE INDEX "idx_players_user_id" ON "players"("user_id");

-- CreateIndex
CREATE INDEX "idx_players_email" ON "players"("email");

-- CreateIndex
CREATE INDEX "idx_player_face_embeddings_player_id" ON "player_face_embeddings"("player_id");

-- CreateIndex
CREATE INDEX "idx_sessions_host_id" ON "sessions"("host_id");

-- CreateIndex
CREATE INDEX "idx_sessions_status" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "idx_sessions_session_date" ON "sessions"("session_date");

-- CreateIndex
CREATE INDEX "idx_session_participants_session_id" ON "session_participants"("session_id");

-- CreateIndex
CREATE INDEX "idx_session_participants_player_id" ON "session_participants"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_session_id_player_id_key" ON "session_participants"("session_id", "player_id");

-- CreateIndex
CREATE INDEX "idx_expense_items_session_id" ON "expense_items"("session_id");

-- CreateIndex
CREATE INDEX "idx_media_assets_session_id" ON "media_assets"("session_id");

-- CreateIndex
CREATE INDEX "idx_media_assets_kind" ON "media_assets"("kind");

-- CreateIndex
CREATE INDEX "idx_detected_faces_session_id" ON "detected_faces"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "detected_faces_media_asset_id_face_index_key" ON "detected_faces"("media_asset_id", "face_index");

-- CreateIndex
CREATE INDEX "idx_face_match_suggestions_detected_face_id" ON "face_match_suggestions"("detected_face_id");

-- CreateIndex
CREATE UNIQUE INDEX "face_match_suggestions_detected_face_id_suggested_player_id_key" ON "face_match_suggestions"("detected_face_id", "suggested_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "face_confirmations_detected_face_id_key" ON "face_confirmations"("detected_face_id");

-- CreateIndex
CREATE INDEX "idx_face_confirmations_player_id" ON "face_confirmations"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "obligations_idempotency_key_key" ON "obligations"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_obligations_session_id" ON "obligations"("session_id");

-- CreateIndex
CREATE INDEX "idx_obligations_payer_id" ON "obligations"("payer_id");

-- CreateIndex
CREATE INDEX "idx_obligations_status" ON "obligations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "obligations_session_id_payer_id_key" ON "obligations"("session_id", "payer_id");

-- CreateIndex
CREATE INDEX "idx_payments_obligation_id" ON "payments"("obligation_id");

-- CreateIndex
CREATE INDEX "idx_payment_proofs_payment_id" ON "payment_proofs"("payment_id");

-- CreateIndex
CREATE INDEX "idx_payment_proofs_status" ON "payment_proofs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "magic_link_tokens_token_hash_key" ON "magic_link_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_magic_link_tokens_token_hash" ON "magic_link_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_magic_link_tokens_player_id" ON "magic_link_tokens"("player_id");

-- CreateIndex
CREATE INDEX "idx_magic_link_tokens_expires_at" ON "magic_link_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_face_embeddings" ADD CONSTRAINT "player_face_embeddings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detected_faces" ADD CONSTRAINT "detected_faces_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detected_faces" ADD CONSTRAINT "detected_faces_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_match_suggestions" ADD CONSTRAINT "face_match_suggestions_detected_face_id_fkey" FOREIGN KEY ("detected_face_id") REFERENCES "detected_faces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_match_suggestions" ADD CONSTRAINT "face_match_suggestions_suggested_player_id_fkey" FOREIGN KEY ("suggested_player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_confirmations" ADD CONSTRAINT "face_confirmations_detected_face_id_fkey" FOREIGN KEY ("detected_face_id") REFERENCES "detected_faces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_confirmations" ADD CONSTRAINT "face_confirmations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_confirmations" ADD CONSTRAINT "face_confirmations_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
